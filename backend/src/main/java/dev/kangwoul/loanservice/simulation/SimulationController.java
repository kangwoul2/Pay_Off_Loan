package dev.kangwoul.loanservice.simulation;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/simulations")
public class SimulationController {
    private final RefinanceSimulationService service;

    public SimulationController(RefinanceSimulationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SimulationResponse> simulate(@Valid @RequestBody SimulationRequest request) {
        return ResponseEntity.ok(service.simulate(request));
    }
}
