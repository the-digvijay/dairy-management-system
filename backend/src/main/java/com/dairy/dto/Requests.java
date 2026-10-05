package com.dairy.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class Requests {

    public record FarmerInput(
        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        @Pattern(
            regexp = "[0-9]{10}",
            message = "Enter a 10-digit mobile number"
        )
        String mobile,

        @NotBlank
        @Size(max = 100)
        String village,

        @Size(max = 100)
        String accountHolderName,

        @Pattern(
            regexp = "^$|[0-9]{9,18}",
            message = "Account number must contain 9 to 18 digits"
        )
        String bankAccountNumber,

        @Pattern(
            regexp = "^$|[A-Z]{4}0[A-Z0-9]{6}",
            message = "Enter a valid uppercase IFSC code"
        )
        String ifscCode
    ) {
        // जुन्या demo आणि test code साठी.
        public FarmerInput(
            String name,
            String mobile,
            String village
        ) {
            this(name, mobile, village, null, null, null);
        }
    }

    public record RateInput(
        @NotNull
        @Pattern(regexp = "COW|BUFFALO")
        String milkType,

        @NotNull
        @DecimalMin("0")
        @DecimalMax("15")
        BigDecimal fat,

        @NotNull
        @DecimalMin("0")
        @DecimalMax("20")
        BigDecimal snf,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal rate
    ) {}

    public record CollectionInput(
        @NotNull
        Long farmerId,

        @NotNull
        @PastOrPresent
        LocalDate date,

        @NotNull
        @Pattern(regexp = "MORNING|EVENING")
        String shift,

        @NotNull
        @Pattern(regexp = "COW|BUFFALO")
        String milkType,

        @NotNull
        @DecimalMin("0.001")
        @Digits(integer = 7, fraction = 3)
        BigDecimal quantity,

        @NotNull
        @DecimalMin("0")
        @DecimalMax("15")
        BigDecimal fat,

        @NotNull
        @DecimalMin("0")
        @DecimalMax("20")
        BigDecimal snf
    ) {}
}