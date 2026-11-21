import taskflow.*;
import java.nio.file.*;
import java.util.NoSuchElementException;

/** Testes sem dependências externas. Execute: ./build.sh test */
public class TaskServiceTest {
    static int fails = 0;
    static void check(String name, boolean ok) { System.out.println((ok ? "OK    " : "FALHA ") + name); if (!ok) fails++; }
    static boolean throwsA(Class<?> c, Runnable r) { try { r.run(); return false; } catch (Throwable t) { return c.isInstance(t); } }

    public static void main(String[] a) throws Exception {
        Path dir = Files.createTempDirectory("taskflow"); Path f = dir.resolve("t.tsv");
        TaskService s = new TaskService(new TaskRepository(f));
        check("título vazio rejeitado", throwsA(IllegalArgumentException.class, () -> { try { s.create("  ", "x", null); } catch (java.io.IOException e) { throw new RuntimeException(e); } }));
        Task t1 = s.create("Estudar Java", "Faculdade", Priority.HIGH);
        Task t2 = s.create("Tarefa\tcom\ttab e acentuação ção", "", null);
        check("id inicial é 1 (falha de validação não consome id)", t1.getId() == 1);
        check("criação em Pendentes", t1.getStatus() == Status.PENDING && s.counts().get(Status.PENDING) == 2);
        check("categoria padrão Geral", t2.getCategory().equals("Geral") && t2.getPriority() == Priority.MEDIUM);
        s.setStatus(t1.getId(), Status.IN_PROGRESS); s.setStatus(t2.getId(), Status.DONE);
        check("mudança de status e contadores", s.counts().get(Status.IN_PROGRESS) == 1 && s.counts().get(Status.DONE) == 1);
        check("produtividade 50%", s.completionRate() == 50);
        s.edit(t1.getId(), "Estudar POO", "Estudos", Priority.LOW);
        check("edição", s.query(null, Priority.LOW, "poo").size() == 1);
        check("busca ignora maiúsculas", s.query(null, null, "ESTUDAR").size() == 1 && s.query(null, null, "poo").size() == 1);
        check("filtro por prioridade", s.query(null, Priority.HIGH, "").isEmpty());
        TaskService again = new TaskService(new TaskRepository(f));
        check("persistência após reiniciar", again.query(null, null, "").size() == 2
                && again.query(Status.DONE, null, "").get(0).getTitle().equals("Tarefa\tcom\ttab e acentuação ção"));
        check("novo id não repete após reiniciar", again.create("Nova", "", null).getId() == 3);
        s.delete(t1.getId());
        check("exclusão", s.query(null, null, "").size() == 1);
        check("excluir inexistente falha", throwsA(NoSuchElementException.class, () -> { try { s.delete(99); } catch (java.io.IOException e) { throw new RuntimeException(e); } }));
        Files.writeString(f, "lixo\n1\tA\tB\tINVALIDA\tDONE\n");
        check("arquivo corrompido não derruba", new TaskService(new TaskRepository(f)).query(null, null, "").isEmpty());
        System.out.println(fails == 0 ? "Todos os testes passaram." : fails + " falha(s).");
        System.exit(fails == 0 ? 0 : 1);
    }
}
