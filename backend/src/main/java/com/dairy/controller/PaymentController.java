package com.dairy.controller;

import com.dairy.dto.PaymentInput;
import com.dairy.service.PaymentService;
import com.dairy.service.PaymentService.PaymentView;
import com.dairy.service.PaymentService.PaymentSummary;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentView save(
        @Valid @RequestBody PaymentInput input
    ) {
        return paymentService.save(input);
    }

    @GetMapping
    public List<PaymentView> list(
        @RequestParam Long farmerId,
        @RequestParam String billMonth
    ) {
        return paymentService.list(farmerId, billMonth);
    }

    @GetMapping("/summary")
    public PaymentSummary summary(
        @RequestParam Long farmerId,
        @RequestParam String billMonth
    ) {
        return paymentService.summary(farmerId, billMonth);
    }
}
