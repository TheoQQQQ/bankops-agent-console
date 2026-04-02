package fi.cgi.bankops.exception;

/** Thrown when a requested case status transition violates business rules. */
public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(String message) {
        super(message);
    }
}
