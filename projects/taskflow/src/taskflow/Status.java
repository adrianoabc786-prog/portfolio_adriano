package taskflow;

public enum Status {
    PENDING("Pendentes"), IN_PROGRESS("Em andamento"), DONE("Concluídas");
    private final String label;
    Status(String label) { this.label = label; }
    @Override public String toString() { return label; }
}
