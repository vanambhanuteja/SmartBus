package com.nie.smartbus.controller;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;

/** BMTC static catalog and separate passenger-observation API. */
@RestController
@RequestMapping("/api/transit")
public class TransitController {
    private final JdbcTemplate db;
    private final RestClient prediction;
    public TransitController(JdbcTemplate db, org.springframework.core.env.Environment env) {
        this.db = db;
        this.prediction = RestClient.builder().baseUrl(env.getProperty("PREDICTION_URL", "http://localhost:8000")).build();
    }

    private long activeFeed() {
        try { return db.queryForObject("select feed_id from gtfs_feeds where is_active=true", Long.class); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "BMTC feed has not been imported"); }
    }

    @GetMapping("/routes")
    public List<Map<String,Object>> routes(@RequestParam(required=false) String q) {
        long f=activeFeed(); String term=q==null?"%":"%"+q.trim()+"%";
        return db.queryForList("select route_id as id, route_short_name as \"routeCode\", coalesce(route_long_name,route_desc,route_short_name) as name, route_type as \"routeType\" from gtfs_routes where feed_id=? and (coalesce(route_short_name,'') ilike ? or coalesce(route_long_name,'') ilike ?) order by route_short_name,route_long_name limit 10000", f,term,term);
    }
    @GetMapping("/stops")
    public List<Map<String,Object>> stops(@RequestParam String routeId) {
        long f=activeFeed();
        return db.queryForList("select distinct s.stop_id as id,s.stop_name as name,s.stop_lat as latitude,s.stop_lon as longitude from gtfs_stop_times t join gtfs_trips tr using(feed_id,trip_id) join gtfs_stops s using(feed_id,stop_id) where t.feed_id=? and tr.route_id=? order by s.stop_name limit 2000",f,routeId);
    }
    @GetMapping("/shapes")
    public List<Map<String,Object>> shapes(@RequestParam String routeId, @RequestParam(required=false) Integer directionId) {
        long f=activeFeed();
        String query="select sh.shape_id as \"shapeId\",sh.shape_pt_sequence as sequence,sh.shape_pt_lat as latitude,sh.shape_pt_lon as longitude from gtfs_trips tr join gtfs_shapes sh on sh.feed_id=tr.feed_id and sh.shape_id=tr.shape_id where tr.feed_id=? and tr.route_id=?";
        if(directionId!=null) query+=" and tr.direction_id=?";
        query+=" group by sh.shape_id,sh.shape_pt_sequence,sh.shape_pt_lat,sh.shape_pt_lon order by sh.shape_id,sh.shape_pt_sequence";
        return directionId==null?db.queryForList(query,f,routeId):db.queryForList(query,f,routeId,directionId);
    }
    @GetMapping("/schedules")
    public List<Map<String,Object>> schedules(@RequestParam String routeId, @RequestParam LocalDate serviceDate,
                                               @RequestParam(required=false) String stopId) {
        long f=activeFeed();
        String weekday=switch(serviceDate.getDayOfWeek().getValue()){case 1->"c.monday";case 2->"c.tuesday";case 3->"c.wednesday";case 4->"c.thursday";case 5->"c.friday";case 6->"c.saturday";default->"c.sunday";};
        String query="select tr.trip_id as \"tripId\",tr.direction_id as \"directionId\",tr.trip_headsign as headsign,st.stop_id as \"stopId\",s.stop_name as \"stopName\",st.stop_sequence as sequence,st.arrival_seconds as \"arrivalSeconds\",st.departure_seconds as \"departureSeconds\",st.timepoint as timepoint from gtfs_trips tr join gtfs_services c using(feed_id,service_id) join gtfs_stop_times st using(feed_id,trip_id) join gtfs_stops s using(feed_id,stop_id) where tr.feed_id=? and tr.route_id=?";
        List<Object> args=new ArrayList<>(List.of(f,routeId));
        if(stopId!=null&&!stopId.isBlank()){query+=" and st.stop_id=?";args.add(stopId);}
        query+=" and (exists(select 1 from gtfs_calendar_dates d where d.feed_id=tr.feed_id and d.service_id=tr.service_id and d.service_date=? and d.exception_type=1) or (not exists(select 1 from gtfs_calendar_dates d where d.feed_id=tr.feed_id and d.service_id=tr.service_id and d.service_date=?) and ? between c.start_date and c.end_date and "+weekday+")) order by st.arrival_seconds nulls last, tr.trip_id,st.stop_sequence limit 10000";
        args.add(serviceDate);args.add(serviceDate);args.add(serviceDate);
        return db.queryForList(query,args.toArray());
    }
    @GetMapping("/fares")
    public List<Map<String,Object>> fares(@RequestParam(required=false) String routeId) {
        long f=activeFeed();
        String query="select distinct a.fare_id as \"fareId\",a.price,a.currency_type as currency,r.route_id as \"routeId\",r.origin_id as \"originZone\",r.destination_id as \"destinationZone\",r.contains_id as \"containsZone\",a.transfers from gtfs_fare_attributes a left join gtfs_fare_rules r using(feed_id,fare_id) where a.feed_id=?";
        if(routeId!=null&&!routeId.isBlank()) query+=" and (r.route_id=? or r.route_id is null)";
        query+=" order by a.fare_id limit 20000";
        return routeId==null||routeId.isBlank()?db.queryForList(query,f):db.queryForList(query,f,routeId);
    }
    @GetMapping("/attribution")
    public Map<String,Object> attribution() {
        return db.queryForMap("select source_url,feed_publisher_name,feed_version,zip_sha256,license,imported_at from gtfs_feeds where is_active=true");
    }
    public record CrowdInput(String routeId, String stopId, String tripId, Integer occupancyPercent,
                             String crowdLevel, String vehicleLabel, String vehicleType,
                             OffsetDateTime observedAt, String note) {}
    @PostMapping("/crowd-reports")
    public Map<String,Object> report(@RequestBody CrowdInput in, Authentication auth) {
        if (in.routeId()==null || in.stopId()==null || in.observedAt()==null || in.occupancyPercent()==null || in.crowdLevel()==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Route, stop, observed time and crowd level are required");
        if (in.observedAt().isAfter(OffsetDateTime.now().plusMinutes(2))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Observed time cannot be in the future");
        if (in.occupancyPercent()<0 || in.occupancyPercent()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Occupancy must be 0 to 100");
        if (!List.of("LOW","MODERATE","HIGH","OVERCROWDED").contains(in.crowdLevel())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid crowd level");
        String expectedLevel=in.occupancyPercent()<=30?"LOW":in.occupancyPercent()<=60?"MODERATE":in.occupancyPercent()<=85?"HIGH":"OVERCROWDED";
        if (!expectedLevel.equals(in.crowdLevel())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Crowd level must match the reported occupancy percentage");
        long f=activeFeed(); Long uid=db.queryForObject("select user_id from users where email=?",Long.class,auth.getName());
        String tripId=in.tripId()==null||in.tripId().isBlank()?null:in.tripId();
        String validSql="select count(*) from gtfs_stop_times t join gtfs_trips tr using(feed_id,trip_id) where t.feed_id=? and tr.route_id=? and t.stop_id=?";
        List<Object> validArgs=new ArrayList<>(List.of(f,in.routeId(),in.stopId()));
        if(tripId!=null){validSql+=" and t.trip_id=?";validArgs.add(tripId);}
        Integer valid=db.queryForObject(validSql,Integer.class,validArgs.toArray());
        if (valid==null || valid==0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"That stop is not served by the selected BMTC route");
        Long id=db.queryForObject("insert into gtfs_crowd_reports(feed_id,route_id,trip_id,stop_id,user_id,occupancy_percent,crowd_level,reported_vehicle_label,vehicle_type,observed_at,note) values(?,?,?,?,?,?,?,?,?,?,?) returning report_id",Long.class,f,in.routeId(),tripId,in.stopId(),uid,in.occupancyPercent(),in.crowdLevel(),trim(in.vehicleLabel(),80),trim(in.vehicleType(),40),in.observedAt(),trim(in.note(),255));
        return Map.of("id",id,"message","Passenger observation recorded","observedAt",in.observedAt());
    }
    private String trim(String v,int n){ return v==null?null:v.substring(0,Math.min(v.length(),n)); }

    @PostMapping("/predictions")
    public Map<String,Object> predict(@RequestBody Map<String,Object> in) {
        String route=String.valueOf(in.get("routeId")); String time=String.valueOf(in.getOrDefault("travelTime","08:00"));
        int dow=((Number)in.getOrDefault("dayOfWeek",0)).intValue(); long f=activeFeed();
        List<Map<String,Object>> reports=db.queryForList("select route_id,extract(hour from observed_at at time zone 'Asia/Kolkata')::int as hour,(extract(isodow from observed_at at time zone 'Asia/Kolkata')::int-1) as dow,occupancy_percent from gtfs_crowd_reports where feed_id=? and route_id=? and observed_at >= now()-interval '180 days' order by observed_at desc limit 5000",f,route);
        if(reports.size()<5) return Map.of("available",false,"message","not enough crowd data to predict","reportsReceived",reports.size(),"reportsRequired",5);
        try {
            Map<String,Object> payload=Map.of("route_id",route,"travel_time",time,"day_of_week",dow,"reports",reports);
            Map<String,Object> result=(Map<String,Object>)prediction.post().uri("/predict/gtfs").body(payload).retrieve().body(Map.class);
            db.update("insert into gtfs_predictions(feed_id,route_id,travel_time,day_of_week,predicted_percent,crowd_level,reports_used) values(?,?,?,?,?,?,?)",f,route,time,dow,((Number)result.get("predictedOccupancyPercent")).doubleValue(),result.get("crowdLevel"),reports.size());
            return result;
        } catch(Exception e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Real-report prediction service is unavailable"); }
    }
}
