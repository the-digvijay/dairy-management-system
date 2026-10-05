package com.dairy.controller;
import org.springframework.web.bind.annotation.*;import org.springframework.web.bind.MethodArgumentNotValidException;import org.springframework.http.*;import org.springframework.web.server.ResponseStatusException;import org.springframework.dao.DataIntegrityViolationException;import java.util.Map;
@RestControllerAdvice public class Errors {
@ExceptionHandler(ResponseStatusException.class) ResponseEntity<?> status(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("message",Objects(e.getReason())));}
private String Objects(String s){return s==null?"Request failed":s;}
@ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e){return ResponseEntity.badRequest().body(Map.of("message",e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+": "+x.getDefaultMessage()).findFirst().orElse("Invalid input")));}
@ExceptionHandler({IllegalArgumentException.class,java.time.format.DateTimeParseException.class,org.springframework.http.converter.HttpMessageNotReadableException.class}) ResponseEntity<?> bad(Exception e){return ResponseEntity.badRequest().body(Map.of("message","Invalid input or date format"));}
@ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> conflict(Exception e){return ResponseEntity.status(409).body(Map.of("message","Duplicate record or record is in use"));}
}
