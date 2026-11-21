package taskflow;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.nio.file.Paths;
import java.util.EnumMap;
import java.util.Map;

/** Interface gráfica (Swing): quadro Kanban com busca, filtro e indicadores. */
public class KanbanApp extends JFrame {
    private final TaskService service;
    private final Map<Status, JPanel> columns = new EnumMap<>(Status.class);
    private final Map<Status, JLabel> headers = new EnumMap<>(Status.class);
    private final JTextField search = new JTextField(16);
    private final JComboBox<Object> filter = new JComboBox<>();
    private final JLabel summary = new JLabel();

    public KanbanApp(TaskService service) {
        super("TaskFlow");
        this.service = service;
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setSize(1000, 640); setLocationRelativeTo(null);

        filter.addItem("Todas as prioridades");
        for (Priority p : Priority.values()) filter.addItem(p);
        JButton add = new JButton("+ Nova tarefa");
        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 8));
        top.add(add); top.add(new JLabel("Buscar:")); top.add(search); top.add(filter); top.add(summary);
        add(top, BorderLayout.NORTH);

        JPanel board = new JPanel(new GridLayout(1, 3, 10, 0));
        board.setBorder(new EmptyBorder(8, 10, 10, 10));
        for (Status s : Status.values()) {
            JPanel col = new JPanel(); col.setLayout(new BoxLayout(col, BoxLayout.Y_AXIS));
            JPanel wrap = new JPanel(new BorderLayout()); wrap.add(col, BorderLayout.NORTH);
            JScrollPane sp = new JScrollPane(wrap); sp.getVerticalScrollBar().setUnitIncrement(16);
            JLabel h = new JLabel(s.toString(), SwingConstants.CENTER); h.setFont(h.getFont().deriveFont(Font.BOLD, 15f));
            JPanel box = new JPanel(new BorderLayout(0, 6)); box.add(h, BorderLayout.NORTH); box.add(sp);
            columns.put(s, col); headers.put(s, h); board.add(box);
        }
        add(board);

        add.addActionListener(e -> edit(null));
        filter.addActionListener(e -> refresh());
        search.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) { refresh(); }
            public void removeUpdate(javax.swing.event.DocumentEvent e) { refresh(); }
            public void changedUpdate(javax.swing.event.DocumentEvent e) { refresh(); }
        });
        refresh();
    }

    private void refresh() {
        Priority p = filter.getSelectedItem() instanceof Priority ? (Priority) filter.getSelectedItem() : null;
        for (Status s : Status.values()) {
            JPanel col = columns.get(s); col.removeAll();
            java.util.List<Task> list = service.query(s, p, search.getText());
            for (Task t : list) col.add(card(t));
            headers.get(s).setText(s + " (" + service.counts().get(s) + ")");
            col.revalidate(); col.repaint();
        }
        summary.setText("Produtividade: " + service.completionRate() + "% concluído");
    }

    private JPanel card(Task t) {
        JPanel c = new JPanel(new BorderLayout(0, 4));
        c.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Color.GRAY), new EmptyBorder(6, 8, 6, 8)));
        c.setMaximumSize(new Dimension(Integer.MAX_VALUE, 110));
        JLabel title = new JLabel("<html><b>" + esc(t.getTitle()) + "</b><br><small>" + esc(t.getCategory()) + " · Prioridade " + t.getPriority() + "</small></html>");
        JPanel btns = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 0));
        Status[] all = Status.values(); int i = t.getStatus().ordinal();
        if (i > 0) btns.add(button("◀", "Mover para " + all[i - 1], () -> run(() -> service.setStatus(t.getId(), all[i - 1]))));
        if (i < 2) btns.add(button("▶", "Mover para " + all[i + 1], () -> run(() -> service.setStatus(t.getId(), all[i + 1]))));
        btns.add(button("Editar", "Editar tarefa", () -> edit(t)));
        btns.add(button("Excluir", "Excluir tarefa", () -> {
            if (JOptionPane.showConfirmDialog(this, "Excluir \"" + t.getTitle() + "\"?", "Confirmar exclusão",
                    JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE) == JOptionPane.YES_OPTION)
                run(() -> service.delete(t.getId()));
        }));
        c.add(title); c.add(btns, BorderLayout.SOUTH);
        return c;
    }

    private JButton button(String text, String tip, Runnable r) {
        JButton b = new JButton(text); b.setToolTipText(tip); b.setMargin(new Insets(1, 6, 1, 6));
        b.addActionListener(e -> r.run()); return b;
    }

    private interface Action { void go() throws Exception; }
    private void run(Action a) {
        try { a.go(); } catch (Exception ex) { JOptionPane.showMessageDialog(this, ex.getMessage(), "Erro", JOptionPane.ERROR_MESSAGE); }
        refresh();
    }

    private void edit(Task t) {
        JTextField title = new JTextField(t == null ? "" : t.getTitle(), 22), cat = new JTextField(t == null ? "" : t.getCategory(), 22);
        JComboBox<Priority> pr = new JComboBox<>(Priority.values()); pr.setSelectedItem(t == null ? Priority.MEDIUM : t.getPriority());
        JPanel f = new JPanel(new GridLayout(0, 1, 0, 4));
        f.add(new JLabel("Título")); f.add(title); f.add(new JLabel("Categoria")); f.add(cat); f.add(new JLabel("Prioridade")); f.add(pr);
        if (JOptionPane.showConfirmDialog(this, f, t == null ? "Nova tarefa" : "Editar tarefa", JOptionPane.OK_CANCEL_OPTION) != JOptionPane.OK_OPTION) return;
        run(() -> { if (t == null) service.create(title.getText(), cat.getText(), (Priority) pr.getSelectedItem());
                    else service.edit(t.getId(), title.getText(), cat.getText(), (Priority) pr.getSelectedItem()); });
    }

    private static String esc(String s) { return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"); }

    public static void main(String[] args) throws Exception {
        TaskService svc = new TaskService(new TaskRepository(Paths.get("data", "tasks.tsv")));
        SwingUtilities.invokeLater(() -> new KanbanApp(svc).setVisible(true));
    }
}
