package fi.cgi.bankops.exception;

/** Thrown when a case ID does not correspond to any persisted case. */
public class CaseNotFoundException extends RuntimeException {

    public CaseNotFoundException(Long id) {
        super("Case not found: id=" + id);
    }
}
