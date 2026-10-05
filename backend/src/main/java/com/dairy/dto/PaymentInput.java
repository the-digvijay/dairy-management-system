package com.dairy.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentInput(

    @NotNull
    @Positive
    Long farmerId,

    @NotBlank
    @Pattern(
        regexp = "[0-9]{4}-(0[1-9]|1[0-2])",
        message = "Bill month must be YYYY-MM"
    )
    String billMonth,

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 13, fraction = 2)
    BigDecimal amount,

    @NotNull
    @PastOrPresent
    LocalDate paymentDate,

    @NotBlank
    @Pattern(
        regexp = "CASH|BANK_TRANSFER|UPI",
        message = "Choose CASH, BANK_TRANSFER or UPI"
    )
    String paymentMethod,

    @Size(max = 100)
    String transactionReference,

    @Size(max = 250)
    String notes,

    @NotBlank
    @Pattern(
        regexp = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        message = "Request ID must be a UUID"
    )
    String requestId

) {}
