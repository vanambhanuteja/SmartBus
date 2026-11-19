package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.Bus;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.BusRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buses")
public class BusController {
    private final BusRepository buses;
    public BusController(BusRepository buses) { this.buses = buses; }

    private static BusDto dto(Bus b) { return new BusDto(b.getId(), b.getRegistration(), b.getCapacity(), b.isActive()); }
    private static void apply(Bus b, BusRequest r) { b.setRegistration(r.registration().trim()); b.setCapacity(r.capacity()); b.setActive(r.active()); }

    @GetMapping public List<BusDto> list() { return buses.findAll().stream().map(BusController::dto).toList(); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BusDto create(@Valid @RequestBody BusRequest r) { Bus b = new Bus(); apply(b, r); return dto(buses.save(b)); }

    @PutMapping("/{id}")
    public BusDto update(@PathVariable Long id, @Valid @RequestBody BusRequest r) {
        Bus b = buses.findById(id).orElseThrow(() -> ApiException.notFound("Bus"));
        apply(b, r);
        return dto(buses.save(b));
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!buses.existsById(id)) throw ApiException.notFound("Bus");
        buses.deleteById(id);
    }
}
