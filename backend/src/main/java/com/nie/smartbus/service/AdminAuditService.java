package com.nie.smartbus.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {
    private final JdbcTemplate db;
    public AdminAuditService(JdbcTemplate db) {
        this.db=db;
        db.execute("CREATE TABLE IF NOT EXISTS admin_audit_log (audit_id BIGSERIAL PRIMARY KEY, actor_email VARCHAR(150) NOT NULL, action VARCHAR(40) NOT NULL, entity_type VARCHAR(40) NOT NULL, entity_id VARCHAR(100), details TEXT, created_at TIMESTAMP NOT NULL DEFAULT now())");
    }
    public void record(String actor,String action,String entity,String id,String details) {
        db.update("insert into admin_audit_log(actor_email,action,entity_type,entity_id,details) values(?,?,?,?,?)",actor,action,entity,id,details);
    }
}
