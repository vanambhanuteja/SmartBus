package com.nie.smartbus.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.core.env.Environment;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpStatus;

/** Small, database-backed extensions for favorites, report trust, planning and admin exports. */
@RestController
@RequestMapping("/api")
public class FeaturesController {
    private final JdbcTemplate db;
    private final RestClient prediction;
    public FeaturesController(JdbcTemplate db, Environment env) { this.db = db; this.prediction=RestClient.builder().baseUrl(env.getProperty("smartbus.prediction-url","http://localhost:8000")).build(); }
    private long user(Authentication a) { return db.queryForObject("select user_id from users where email=?", Long.class, a.getName()); }
    private long feed() { try { return db.queryForObject("select feed_id from gtfs_feeds where is_active=true", Long.class); } catch(Exception e) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"BMTC feed unavailable"); } }

    @GetMapping("/me/favorites")
    public Map<String,Object> favorites(Authentication a) {
        long u=user(a), f; try { f=feed(); } catch(Exception e) { f=-1; }
        return Map.of("routes",db.queryForList("select r.route_id id,r.route_code \"routeCode\",r.name from favorite_routes x join routes r using(route_id) where x.user_id=? order by x.created_at desc",u),
          "stops",db.queryForList("select s.stop_id id,s.name from favorite_stops x join bus_stops s using(stop_id) where x.user_id=? order by x.created_at desc",u),
          "bmtcRoutes",f<0?List.of():db.queryForList("select r.route_id id,r.route_short_name \"routeCode\",coalesce(r.route_long_name,r.route_desc,r.route_short_name) name from favorite_gtfs_routes x join gtfs_routes r using(feed_id,route_id) where x.user_id=? and x.feed_id=? order by x.created_at desc",u,f),
          "bmtcStops",f<0?List.of():db.queryForList("select s.stop_id id,s.stop_name name,s.stop_lat latitude,s.stop_lon longitude from favorite_gtfs_stops x join gtfs_stops s using(feed_id,stop_id) where x.user_id=? and x.feed_id=? order by x.created_at desc",u,f));
    }
    public record Favorite(String type,String id) {}
    @PostMapping("/me/favorites")
    public ResponseEntity<?> addFavorite(@RequestBody Favorite x, Authentication a) {
        long u=user(a); String id=x.id();
        switch(x.type()) {
          case "route" -> db.update("insert into favorite_routes(user_id,route_id) values(?,?) on conflict do nothing",u,Long.valueOf(id));
          case "stop" -> db.update("insert into favorite_stops(user_id,stop_id) values(?,?) on conflict do nothing",u,Long.valueOf(id));
          case "bmtcRoute" -> db.update("insert into favorite_gtfs_routes(user_id,feed_id,route_id) values(?,?,?) on conflict do nothing",u,feed(),id);
          case "bmtcStop" -> db.update("insert into favorite_gtfs_stops(user_id,feed_id,stop_id) values(?,?,?) on conflict do nothing",u,feed(),id);
          default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown favorite type");
        }
        return ResponseEntity.ok(Map.of("saved",true));
    }
    @DeleteMapping("/me/favorites")
    public ResponseEntity<?> deleteFavorite(@RequestParam String type,@RequestParam String id,Authentication a) {
        long u=user(a); switch(type) {
          case "route" -> db.update("delete from favorite_routes where user_id=? and route_id=?",u,Long.valueOf(id));
          case "stop" -> db.update("delete from favorite_stops where user_id=? and stop_id=?",u,Long.valueOf(id));
          case "bmtcRoute" -> db.update("delete from favorite_gtfs_routes where user_id=? and feed_id=? and route_id=?",u,feed(),id);
          case "bmtcStop" -> db.update("delete from favorite_gtfs_stops where user_id=? and feed_id=? and stop_id=?",u,feed(),id);
          default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown favorite type");
        } return ResponseEntity.noContent().build();
    }

    public record Vote(boolean helpful) {}
    public record Flag(String reason) {}
    @PostMapping("/crowd-reports/{id}/feedback")
    public Map<String,Object> demoFeedback(@PathVariable long id,@RequestBody Vote v,Authentication a) {
        db.update("insert into report_confirmations(report_id,user_id,helpful) values(?,?,?) on conflict(report_id,user_id) do update set helpful=excluded.helpful,created_at=now()",id,user(a),v.helpful());
        return trustCounts("report_confirmations",id);
    }
    @PostMapping("/transit/crowd-reports/{id}/feedback")
    public Map<String,Object> transitFeedback(@PathVariable long id,@RequestBody Vote v,Authentication a) {
        db.update("insert into gtfs_report_confirmations(report_id,user_id,helpful) values(?,?,?) on conflict(report_id,user_id) do update set helpful=excluded.helpful,created_at=now()",id,user(a),v.helpful());
        return trustCounts("gtfs_report_confirmations",id);
    }
    private Map<String,Object> trustCounts(String table,long id) {
        Map<String,Object> counts=db.queryForMap("select count(*) filter(where helpful) helpful,count(*) filter(where not helpful) not_helpful from "+table+" where report_id=?",id);
        long yes=((Number)counts.get("helpful")).longValue(), no=((Number)counts.get("not_helpful")).longValue();
        return Map.of("helpful",yes,"not_helpful",no,"trust_percent",yes+no==0?0:Math.round(100.0*yes/(yes+no)));
    }

    @PostMapping("/crowd-reports/{id}/flag")
    public Map<String,Object> flagDemo(@PathVariable long id,@RequestBody(required=false) Flag body,Authentication a) {
        long uid=user(a); Integer own=db.queryForObject("select count(*) from crowd_reports where report_id=? and user_id=?",Integer.class,id,uid);
        if(own==null||own==0) db.update("insert into crowd_report_flags(report_id,user_id,reason) values(?,?,?) on conflict(report_id,user_id) do update set reason=excluded.reason,created_at=now()",id,uid,body==null?null:trim(body.reason(),255));
        return Map.of("flags",db.queryForObject("select count(*) from crowd_report_flags where report_id=?",Long.class,id));
    }
    @PostMapping("/transit/crowd-reports/{id}/flag")
    public Map<String,Object> flagTransit(@PathVariable long id,@RequestBody(required=false) Flag body,Authentication a) {
        long uid=user(a); Integer own=db.queryForObject("select count(*) from gtfs_crowd_reports where report_id=? and user_id=?",Integer.class,id,uid);
        if(own==null||own==0) db.update("insert into gtfs_report_flags(report_id,user_id,reason) values(?,?,?) on conflict(report_id,user_id) do update set reason=excluded.reason,created_at=now()",id,uid,body==null?null:trim(body.reason(),255));
        return Map.of("flags",db.queryForObject("select count(*) from gtfs_report_flags where report_id=?",Long.class,id));
    }

    @GetMapping("/admin/reports/flagged")
    public List<Map<String,Object>> flaggedReports() {
        return db.queryForList("""
          select 'demo' network,r.report_id id,rt.route_code route,r.occupancy_percent occupancy,r.crowd_level level,r.note,
                 r.flagged auto_flagged,count(f.user_id) user_flags,r.reported_at
          from crowd_reports r join routes rt using(route_id) left join crowd_report_flags f using(report_id)
          where r.flagged or f.report_id is not null group by r.report_id,rt.route_code
          union all
          select 'BMTC' network,r.report_id id,rt.route_short_name route,r.occupancy_percent occupancy,r.crowd_level level,r.note,
                 r.flagged auto_flagged,count(f.user_id) user_flags,r.reported_at
          from gtfs_crowd_reports r join gtfs_routes rt using(feed_id,route_id) left join gtfs_report_flags f using(report_id)
          where r.flagged or f.report_id is not null group by r.report_id,rt.route_short_name
          order by reported_at desc limit 500
          """);
    }
    public record BulkDelete(String network,List<Long> ids) {}
    @PostMapping("/admin/reports/bulk-delete")
    public Map<String,Object> bulkDelete(@RequestBody BulkDelete body,Authentication actor) {
        if(body.ids()==null||body.ids().isEmpty()||body.ids().size()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select between 1 and 100 reports");
        if(!List.of("demo","BMTC").contains(body.network())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"network must be demo or BMTC");
        String table=body.network().equals("demo")?"crowd_reports":"gtfs_crowd_reports";
        String flags=body.network().equals("demo")?"crowd_report_flags":"gtfs_report_flags";
        String marks=String.join(",",java.util.Collections.nCopies(body.ids().size(),"?"));
        db.update("update "+table+" set flagged=true where report_id in (select report_id from "+flags+" where report_id in ("+marks+"))",body.ids().toArray());
        int removed=db.update("delete from "+table+" where flagged=true and report_id in ("+marks+")",body.ids().toArray());
        db.update("insert into admin_audit_log(actor_email,action,entity_type,entity_id,details) values(?,?,?,?,?)",actor.getName(),"BULK_DELETE",body.network()+"_reports",body.ids().toString(),"Removed "+removed+" automatically flagged report(s)");
        return Map.of("deleted",removed);
    }
    @PostMapping("/admin/reports/moderation/resolve")
    public Map<String,Object> resolveFlags(@RequestBody BulkDelete body,Authentication actor) {
        if(body.ids()==null||body.ids().isEmpty()||body.ids().size()>100||!List.of("demo","BMTC").contains(body.network())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select up to 100 reports in one network");
        String table=body.network().equals("demo")?"crowd_reports":"gtfs_crowd_reports", flags=body.network().equals("demo")?"crowd_report_flags":"gtfs_report_flags";
        String marks=String.join(",",java.util.Collections.nCopies(body.ids().size(),"?"));
        db.update("delete from "+flags+" where report_id in ("+marks+")",body.ids().toArray());
        int resolved=db.update("update "+table+" set flagged=false where report_id in ("+marks+")",body.ids().toArray());
        db.update("insert into admin_audit_log(actor_email,action,entity_type,entity_id,details) values(?,?,?,?,?)",actor.getName(),"RESOLVE_FLAGS",body.network()+"_reports",body.ids().toString(),"Cleared flags on "+resolved+" report(s)");
        return Map.of("resolved",resolved);
    }

    @GetMapping("/admin/forecast-accuracy")
    public List<Map<String,Object>> forecastAccuracy() {
        return db.queryForList("""
          select p.prediction_id id,r.route_code route,p.travel_time,p.predicted_percent predicted,
                 actual.occupancy_percent actual,round((actual.occupancy_percent-p.predicted_percent)::numeric,1) error,
                 p.created_at predicted_at,actual.reported_at observed_at
          from predictions p join routes r on r.route_id=p.route_id
          join lateral (
            select c.occupancy_percent,c.reported_at from crowd_reports c
            where c.route_id=p.route_id and c.source='PASSENGER' and not c.flagged and c.reported_at>p.created_at
              and c.reported_at<=p.created_at+interval '14 days'
              and (extract(isodow from c.reported_at)::int-1)=p.day_of_week
              and least(abs(extract(hour from c.reported_at)::int-split_part(p.travel_time,':',1)::int),
                         24-abs(extract(hour from c.reported_at)::int-split_part(p.travel_time,':',1)::int))<=1
            order by c.reported_at limit 1
          ) actual on true
          union all
          select p.prediction_id id,'BMTC '||coalesce(r.route_short_name,p.route_id) route,p.travel_time,
                 p.predicted_percent predicted,actual.occupancy_percent actual,
                 round((actual.occupancy_percent-p.predicted_percent)::numeric,1) error,
                 p.created_at predicted_at,actual.observed_at observed_at
          from gtfs_predictions p join gtfs_routes r using(feed_id,route_id)
          join lateral (
            select c.occupancy_percent,c.observed_at from gtfs_crowd_reports c
            where c.feed_id=p.feed_id and c.route_id=p.route_id and not c.flagged and c.observed_at>p.created_at
              and c.observed_at<=p.created_at+interval '14 days'
              and (extract(isodow from c.observed_at)::int-1)=p.day_of_week
              and least(abs(extract(hour from c.observed_at)::int-split_part(p.travel_time,':',1)::int),
                         24-abs(extract(hour from c.observed_at)::int-split_part(p.travel_time,':',1)::int))<=1
            order by c.observed_at limit 1
          ) actual on true order by predicted_at desc limit 500
          """);
    }

    @GetMapping("/admin/audit-log")
    public List<Map<String,Object>> auditLog() { return db.queryForList("select actor_email,action,entity_type,entity_id,details,created_at from admin_audit_log order by created_at desc limit 500"); }

    private String trim(String s,int max){return s==null?null:s.substring(0,Math.min(max,s.length()));}

    @GetMapping("/transit/plan")
    public Map<String,Object> plan(@RequestParam String fromStop,@RequestParam String toStop) {
        long f=feed();
        var direct=db.queryForList("""
          with from_seq as (
            select tr.route_id,st.trip_id,min(st.stop_sequence) seq
            from gtfs_stop_times st join gtfs_trips tr on tr.feed_id=st.feed_id and tr.trip_id=st.trip_id
            where st.feed_id=? and st.stop_id=? group by tr.route_id,st.trip_id
          ), to_seq as (
            select tr.route_id,st.trip_id,min(st.stop_sequence) seq
            from gtfs_stop_times st join gtfs_trips tr on tr.feed_id=st.feed_id and tr.trip_id=st.trip_id
            where st.feed_id=? and st.stop_id=? group by tr.route_id,st.trip_id
          )
          select r.route_id id,r.route_short_name \"routeCode\",coalesce(r.route_long_name,r.route_desc,r.route_short_name) name,
                 count(distinct a.trip_id) trips
          from from_seq a join to_seq b on a.route_id=b.route_id and a.trip_id=b.trip_id and a.seq<b.seq
          join gtfs_routes r on r.feed_id=? and r.route_id=a.route_id
          group by r.route_id,r.route_short_name,r.route_long_name,r.route_desc
          order by r.route_short_name limit 100
          """,f,fromStop,f,toStop,f);
        if(!direct.isEmpty()) return Map.of("directRoutes",direct,"transferOptions",List.of());
        var transfers=db.queryForList("""
          with origin_trip as (
            select tr.route_id,st.trip_id,min(st.stop_sequence) origin_seq
            from gtfs_stop_times st join gtfs_trips tr on tr.feed_id=st.feed_id and tr.trip_id=st.trip_id
            where st.feed_id=? and st.stop_id=? group by tr.route_id,st.trip_id
          ), destination_trip as (
            select tr.route_id,st.trip_id,min(st.stop_sequence) destination_seq
            from gtfs_stop_times st join gtfs_trips tr on tr.feed_id=st.feed_id and tr.trip_id=st.trip_id
            where st.feed_id=? and st.stop_id=? group by tr.route_id,st.trip_id
          ), first_leg as (
            select o.route_id,st.stop_id transfer_stop,count(distinct o.trip_id) first_trips
            from origin_trip o join gtfs_stop_times st on st.feed_id=? and st.trip_id=o.trip_id and st.stop_sequence>o.origin_seq
            where st.stop_id<>? and st.stop_id<>? group by o.route_id,st.stop_id
          ), second_leg as (
            select d.route_id,st.stop_id transfer_stop,count(distinct d.trip_id) second_trips
            from destination_trip d join gtfs_stop_times st on st.feed_id=? and st.trip_id=d.trip_id and st.stop_sequence<d.destination_seq
            where st.stop_id<>? and st.stop_id<>? group by d.route_id,st.stop_id
          )
          select f.transfer_stop \"transferStopId\",s.stop_name \"transferStopName\",
                 r1.route_short_name \"firstRouteCode\",coalesce(r1.route_long_name,r1.route_desc,r1.route_short_name) \"firstRouteName\",
                 r2.route_short_name \"secondRouteCode\",coalesce(r2.route_long_name,r2.route_desc,r2.route_short_name) \"secondRouteName\",
                 f.first_trips \"firstTripOptions\",s2.second_trips \"secondTripOptions\"
          from first_leg f join second_leg s2 on s2.transfer_stop=f.transfer_stop and s2.route_id<>f.route_id
          join gtfs_stops s on s.feed_id=? and s.stop_id=f.transfer_stop
          join gtfs_routes r1 on r1.feed_id=? and r1.route_id=f.route_id
          join gtfs_routes r2 on r2.feed_id=? and r2.route_id=s2.route_id
          order by s.stop_name,r1.route_short_name,r2.route_short_name limit 50
          """,f,fromStop,f,toStop,f,fromStop,toStop,f,fromStop,toStop,f,f,f);
        return Map.of("directRoutes",direct,"transferOptions",transfers);
    }

    @GetMapping("/admin/passenger-reports.csv")
    public ResponseEntity<byte[]> export() {
        var rows=db.queryForList("select r.report_id,r.route_id,rt.route_code,rt.name route_name,r.occupancy_percent,r.crowd_level,r.note,r.reported_at,u.email from crowd_reports r join routes rt using(route_id) left join users u using(user_id) where r.source='PASSENGER' order by r.reported_at desc");
        StringBuilder csv=new StringBuilder("network,source,report_id,route_id,route_code,route_name,stop_id,observed_at,occupancy_percent,crowd_level,note,vehicle_label,vehicle_type,reported_at,user_email\r\n");
        for(var row:rows) csv.append(csvRow("Mysuru demo","PASSENGER",row.get("report_id"),row.get("route_id"),row.get("route_code"),row.get("route_name"),null,row.get("reported_at"),row.get("occupancy_percent"),row.get("crowd_level"),row.get("note"),null,null,row.get("reported_at"),row.get("email")));
        try {
          long f=feed();
          var transit=db.queryForList("select r.report_id,r.route_id,r.stop_id,r.observed_at,r.occupancy_percent,r.crowd_level,r.note,r.reported_vehicle_label,r.vehicle_type,r.reported_at,u.email,coalesce(rt.route_short_name,r.route_id) route_code,coalesce(rt.route_long_name,rt.route_desc,rt.route_short_name) route_name from gtfs_crowd_reports r join gtfs_routes rt using(feed_id,route_id) left join users u using(user_id) where r.feed_id=? order by r.reported_at desc",f);
          for(var row:transit) csv.append(csvRow("BMTC","PASSENGER",row.get("report_id"),row.get("route_id"),row.get("route_code"),row.get("route_name"),row.get("stop_id"),row.get("observed_at"),row.get("occupancy_percent"),row.get("crowd_level"),row.get("note"),row.get("reported_vehicle_label"),row.get("vehicle_type"),row.get("reported_at"),row.get("email")));
        } catch(Exception ignored) { /* The demo CSV remains available when no GTFS feed has been imported. */ }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=smartbus-passenger-reports.csv").contentType(MediaType.parseMediaType("text/csv; charset=utf-8")).body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }
    private String csv(String value) { return "\""+value.replace("\"","\"\"")+"\""; }
    private String csvRow(Object... values) { return java.util.Arrays.stream(values).map(v->csv(v==null?"":v.toString())).reduce((x,y)->x+","+y).orElse("")+"\r\n"; }

    @GetMapping("/admin/route-heatmap")
    public List<Map<String,Object>> heatmap(@RequestParam(required=false) Long routeId) {
        if(routeId==null) return db.queryForList("select route_id,extract(isodow from reported_at)::int-1 weekday,extract(hour from reported_at)::int hour,round(avg(occupancy_percent),1) occupancy,count(*) reports from crowd_reports where source='PASSENGER' group by route_id,weekday,hour order by route_id,weekday,hour");
        return db.queryForList("select route_id,extract(isodow from reported_at)::int-1 weekday,extract(hour from reported_at)::int hour,round(avg(occupancy_percent),1) occupancy,count(*) reports from crowd_reports where source='PASSENGER' and route_id=? group by route_id,weekday,hour order by weekday,hour",routeId);
    }
    @GetMapping("/admin/model-info")
    public Map<?,?> modelInfo() { try { return prediction.get().uri("/model-info").retrieve().body(Map.class); } catch(Exception e) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Model metrics are unavailable"); } }
}
