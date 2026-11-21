package taskflow;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/** Regras de negócio: CRUD, filtros, busca e indicadores. */
public class TaskService {
    private final TaskRepository repo;
    private final Map<Integer, Task> tasks = new LinkedHashMap<>();
    private int nextId = 1;

    public TaskService(TaskRepository repo) throws IOException {
        this.repo = repo;
        for (Task t : repo.load()) { tasks.put(t.getId(), t); nextId = Math.max(nextId, t.getId() + 1); }
    }

    private static String clean(String title) {
        if (title == null || title.trim().isEmpty()) throw new IllegalArgumentException("O título não pode ser vazio.");
        if (title.trim().length() > 120) throw new IllegalArgumentException("O título deve ter até 120 caracteres.");
        return title.trim();
    }
    private Task get(int id) {
        Task t = tasks.get(id);
        if (t == null) throw new NoSuchElementException("Tarefa não encontrada: " + id);
        return t;
    }

    public Task create(String title, String category, Priority p) throws IOException {
        String cleanTitle = clean(title);   // valida antes de consumir um id
        Task t = new Task(nextId++, cleanTitle, category == null || category.isBlank() ? "Geral" : category.trim(),
                p == null ? Priority.MEDIUM : p, Status.PENDING);
        tasks.put(t.getId(), t); repo.save(tasks.values()); return t;
    }
    public void edit(int id, String title, String category, Priority p) throws IOException {
        Task t = get(id);
        t.setTitle(clean(title)); t.setCategory(category == null || category.isBlank() ? "Geral" : category.trim());
        if (p != null) t.setPriority(p);
        repo.save(tasks.values());
    }
    public void setStatus(int id, Status s) throws IOException { get(id).setStatus(s); repo.save(tasks.values()); }
    public void delete(int id) throws IOException { get(id); tasks.remove(id); repo.save(tasks.values()); }

    /** Consulta com filtro opcional de prioridade e busca por título (ignora maiúsculas). */
    public List<Task> query(Status status, Priority priority, String search) {
        String q = search == null ? "" : search.trim().toLowerCase();
        return tasks.values().stream()
                .filter(t -> status == null || t.getStatus() == status)
                .filter(t -> priority == null || t.getPriority() == priority)
                .filter(t -> t.getTitle().toLowerCase().contains(q))
                .collect(Collectors.toList());
    }
    public Map<Status, Long> counts() {
        Map<Status, Long> m = new EnumMap<>(Status.class);
        for (Status s : Status.values()) m.put(s, 0L);
        tasks.values().forEach(t -> m.merge(t.getStatus(), 1L, Long::sum));
        return m;
    }
    /** Percentual concluído (0 a 100), ou 0 sem tarefas. */
    public int completionRate() {
        return tasks.isEmpty() ? 0 : (int) Math.round(100.0 * counts().get(Status.DONE) / tasks.size());
    }
}
