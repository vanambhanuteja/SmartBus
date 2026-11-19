package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.Bus;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.BusRepository;
import com.nie.smartbus.service.AdminAuditService;
import jakarta.validation.Valid;
import java.util.List;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buses")
public class BusController {
    private final BusRepository buses;
    private final AdminAuditService audit;
    public BusController(BusRepository buses,AdminAuditService audit) { this.buses = buses; this.audit=audit; }

    private static BusDto dto(Bus b) { return new BusDto(b.getId(), b.getRegistration(), b.getCapacity(), b.isActive()); }
    private static void apply(Bus b, BusRequest r) { b.setRegistration(r.registration().trim()); b.setCapacity(r.capacity()); b.setActive(r.active()); }

    @GetMapping public List<BusDto> list() { return buses.findAll().stream().map(BusController::dto).toList(); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BusDto create(@Valid @RequestBody BusRequest r,Principal p) { Bus b = new Bus(); apply(b, r); var out=dto(buses.save(b)); audit.record(p.getName(),"CREATE","bus",out.id().toString(),out.registration()); return out; }

    @PutMapping("/{id}")
    public BusDto update(@PathVariable Long id, @Valid @RequestBody BusRequest r,Principal p) {
        Bus b = buses.findById(id).orElseThrow(() -> ApiException.notFound("Bus"));
        apply(b, r);
        var out=dto(buses.save(b)); audit.record(p.getName(),"UPDATE","bus",id.toString(),out.registration()); return out;
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,Principal p) {
        if (!buses.existsById(id)) throw ApiException.notFound("Bus");
        buses.deleteById(id);
        audit.record(p.getName(),"DELETE","bus",id.toString(),null);
    }
}
