package com.dairy.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "farmer_payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    public Farmer farmer;

    // ज्या महिन्याच्या बिलासाठी पैसे दिले: उदाहरण 2026-10
    @Column(nullable = false, length = 7)
    public String billMonth;

    @Column(nullable = false, precision = 15, scale = 2)
    public BigDecimal amount;

    @Column(nullable = false)
    public LocalDate paymentDate;

    // CASH, BANK_TRANSFER किंवा UPI
    @Column(nullable = false, length = 20)
    public String paymentMethod;

    @Column(length = 100)
    public String transactionReference;

    @Column(length = 250)
    public String notes;

    // एकाच request मुळे payment दोनदा save होऊ नये.
    @Column(nullable = false, unique = true, length = 36)
    public String requestId;
}
