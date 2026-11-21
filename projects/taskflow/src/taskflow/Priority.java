package taskflow;

public enum Priority {
    LOW("Baixa"), MEDIUM("Média"), HIGH("Alta");
    private final String label;
    Priority(String label) { this.label = label; }
    @Override public String toString() { return label; }
}
