package taskflow;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/** Persistência em arquivo texto (uma tarefa por linha, campos separados por TAB). */
public class TaskRepository {
    private final Path file;

    public TaskRepository(Path file) { this.file = file; }

    private static String esc(String s) {
        return s.replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "");
    }
    private static String unesc(String s) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(++i);
                b.append(n == 't' ? '\t' : n == 'n' ? '\n' : n);
            } else b.append(c);
        }
        return b.toString();
    }

    public List<Task> load() throws IOException {
        List<Task> tasks = new ArrayList<>();
        if (!Files.exists(file)) return tasks;
        for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
            String[] f = line.split("\t", -1);
            try {   // linhas corrompidas são ignoradas, sem derrubar o programa
                if (f.length != 5) continue;
                tasks.add(new Task(Integer.parseInt(f[0]), unesc(f[1]), unesc(f[2]),
                        Priority.valueOf(f[3]), Status.valueOf(f[4])));
            } catch (IllegalArgumentException ignored) { }
        }
        return tasks;
    }

    public void save(Collection<Task> tasks) throws IOException {
        if (file.getParent() != null) Files.createDirectories(file.getParent());
        List<String> lines = new ArrayList<>();
        for (Task t : tasks)
            lines.add(t.getId() + "\t" + esc(t.getTitle()) + "\t" + esc(t.getCategory()) + "\t" + t.getPriority() .name() + "\t" + t.getStatus().name());
        Path tmp = file.resolveSibling(file.getFileName() + ".tmp");   // gravação atômica
        Files.write(tmp, lines, StandardCharsets.UTF_8);
        Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
    }
}
