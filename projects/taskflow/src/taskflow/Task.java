package taskflow;

/** Entidade de tarefa. Mutável apenas via TaskService. */
public class Task {
    private final int id;
    private String title, category;
    private Priority priority;
    private Status status;

    public Task(int id, String title, String category, Priority priority, Status status) {
        this.id = id; this.title = title; this.category = category;
        this.priority = priority; this.status = status;
    }
    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public Priority getPriority() { return priority; }
    public Status getStatus() { return status; }
    void setTitle(String t) { title = t; }
    void setCategory(String c) { category = c; }
    void setPriority(Priority p) { priority = p; }
    void setStatus(Status s) { status = s; }
}
