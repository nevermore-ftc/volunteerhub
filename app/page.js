"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award, BookOpen, CheckCircle, Clock, MapPin, Plus, Search, Sparkles, User,
  Users, X, Loader2, Filter, LogOut, Pencil, Trash2, Shield, Undo2,
} from "lucide-react";

const CATEGORIES = ["Мероприятия", "Спорт", "Экология", "Помощь младшим", "Библиотека"];
const STORAGE_KEY = "volunteerhub-data-v2";
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "admin2025";
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

const INITIAL_TASKS = [
  { id: 1, category: "Мероприятия", title: "Помощь на школьном концерте", description: "Встречай гостей, помогай рассаживать зрителей и следи за порядком в актовом зале. Ты станешь лицом праздника!", hours: 3, location: "Актовый зал", date: "2026-12-20", time: "15:00", total: 5, author: "Учком школы" },
  { id: 2, category: "Экология", title: "Субботник на школьном дворе", description: "Вместе уберём территорию, посадим цветы у входа и разберём мусор по контейнерам. Нужны перчатки и хорошее настроение.", hours: 2, location: "Школьный двор", date: "2026-12-21", time: "10:00", total: 10, author: "Мария Ивановна, биолог" },
  { id: 3, category: "Библиотека", title: "Сортировка новых учебников", description: "Помоги библиотекарю разобрать и промаркировать новые книги, чтобы они быстрее попали к ученикам.", hours: 2, location: "Библиотека", date: "2026-12-22", time: "14:30", total: 4, author: "Библиотекарь" },
  { id: 4, category: "Спорт", title: "Судейство школьного турнира", description: "Веди счёт матчей, помогай судьям и собирай команды. Обязанности: учёт результатов и подготовка инвентаря.", hours: 4, location: "Спортзал", date: "2026-12-23", time: "12:00", total: 6, author: "Алексей Петрович, физрук" },
];

const EMPTY_FORM = { title: "", category: CATEGORIES[0], location: "", date: "", time: "", hours: 2, total: 5, description: "", author: "" };

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

async function generateDescription(title) {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("API-ключ Gemini не задан. Добавьте NEXT_PUBLIC_GEMINI_API_KEY или напишите описание вручную.");
  const prompt = `Составь короткое (2-3 предложения), структурированное и мотивирующее описание для школьной волонтёрской задачи: "${title}". Укажи обязанности ученика.`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini вернул ошибку ${res.status}. Проверьте ключ и название модели.`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("ИИ не вернул текст. Попробуйте ещё раз.");
  return text;
}

function formatDate(date, time) {
  if (!date) return time || "Дата уточняется";
  const label = new Date(date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return time ? `${label}, ${time}` : label;
}

/* ---------- Экран входа ---------- */
function AuthScreen({ users, onUser, onAdmin }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (adminMode) {
      if (code === ADMIN_CODE) onAdmin();
      else setError("Неверный код администратора.");
      return;
    }
    const f = first.trim(), l = last.trim();
    if (!f || !l) { setError("Введите имя и фамилию."); return; }
    onUser(f, l);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md"><BookOpen size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">VolunteerHub</h1>
            <p className="text-xs text-slate-500">Единая школьная система волонтёрства</p>
          </div>
        </div>
        {adminMode ? (
          <label className="block text-sm font-medium">
            Код администратора
            <input type="password" className={inputCls + " mt-1"} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </label>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Введите имя и фамилию. Если вы здесь впервые, аккаунт создастся автоматически.</p>
            <label className="block text-sm font-medium">Имя
              <input className={inputCls + " mt-1"} value={first} onChange={(e) => setFirst(e.target.value)} autoFocus />
            </label>
            <label className="block text-sm font-medium">Фамилия
              <input className={inputCls + " mt-1"} value={last} onChange={(e) => setLast(e.target.value)} />
            </label>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
          {adminMode ? "Войти как администратор" : "Войти"}
        </button>
        <button type="button" onClick={() => { setAdminMode(!adminMode); setError(""); }} className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
          <Shield size={14} /> {adminMode ? "Назад ко входу для учеников" : "Вход для администратора"}
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-400">Зарегистрировано учеников: {users.length}</p>
      </form>
    </div>
  );
}

/* ---------- Окно создания / редактирования ---------- */
function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [formError, setFormError] = useState("");
  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  async function handleGenerate() {
    if (!form.title.trim()) { setAiError("Сначала введите название задачи."); return; }
    setAiError(""); setAiLoading(true);
    try { set("description", await generateDescription(form.title.trim())); }
    catch (e) { setAiError(e.message || "Не удалось получить ответ от ИИ."); }
    finally { setAiLoading(false); }
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) { setFormError("Заполните название, место и описание."); return; }
    onSave({
      ...form,
      title: form.title.trim(), location: form.location.trim(), description: form.description.trim(),
      author: form.author.trim() || "Организатор",
      hours: Math.max(1, Number(form.hours) || 1), total: Math.max(1, Number(form.total) || 1),
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Редактирование задачи" : "Новая волонтёрская задача"}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium">Название задачи
            <input className={inputCls + " mt-1"} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Например: Помощь на ярмарке" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Категория
              <select className={inputCls + " mt-1"} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Место проведения
              <input className={inputCls + " mt-1"} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Актовый зал" />
            </label>
            <label className="block text-sm font-medium">Дата
              <input type="date" className={inputCls + " mt-1"} value={form.date} onChange={(e) => set("date", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Время
              <input type="time" className={inputCls + " mt-1"} value={form.time} onChange={(e) => set("time", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Часов волонтёрства
              <input type="number" min="1" max="24" className={inputCls + " mt-1"} value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Нужно человек
              <input type="number" min="1" max="200" className={inputCls + " mt-1"} value={form.total} onChange={(e) => set("total", e.target.value)} />
            </label>
          </div>
          <label className="block text-sm font-medium">Организатор
            <input className={inputCls + " mt-1"} value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Учитель или учком" />
          </label>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Описание</span>
              <button type="button" onClick={handleGenerate} disabled={aiLoading} className="flex items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 disabled:opacity-60">
                {aiLoading ? (<><Loader2 size={14} className="animate-spin" /> ИИ думает...</>) : (<><Sparkles size={14} /> Сгенерировать с ИИ (Gemini)</>)}
              </button>
            </div>
            <textarea rows={4} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Опишите задачу и обязанности ученика" />
            {aiError && <p className="mt-1.5 text-xs text-red-600">{aiError}</p>}
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            {initial ? "Сохранить изменения" : "Опубликовать задачу"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Главная страница ---------- */
export default function Home() {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null); // {type:"user", id} | {type:"admin"} | null
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Все");
  const [tab, setTab] = useState("tasks");
  const [modal, setModal] = useState(null); // null | {task: obj|null}

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
        if (Array.isArray(d.users)) setUsers(d.users);
        if (d.session) setSession(d.session);
      }
    } catch (e) { /* игнорируем повреждённые данные */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, users, session })); } catch (e) { /* хранилище недоступно */ }
  }, [ready, tasks, users, session]);

  const isAdmin = session?.type === "admin";
  const me = session?.type === "user" ? users.find((u) => u.id === session.id) : null;

  const signups = (taskId) => users.filter((u) => u.joined.includes(taskId));
  const hoursOf = (u) => tasks.filter((t) => u.joined.includes(t.id)).reduce((s, t) => s + t.hours, 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => (filter === "Все" || t.category === filter) && (!q || t.title.toLowerCase().includes(q)));
  }, [tasks, query, filter]);

  function loginUser(first, last) {
    const found = users.find((u) => u.first.toLowerCase() === first.toLowerCase() && u.last.toLowerCase() === last.toLowerCase());
    if (found) { setSession({ type: "user", id: found.id }); return; }
    const user = { id: Date.now(), first, last, joined: [] };
    setUsers((u) => [...u, user]);
    setSession({ type: "user", id: user.id });
  }

  function join(task) {
    if (!me || me.joined.includes(task.id) || task.total - signups(task.id).length <= 0) return;
    setUsers((all) => all.map((u) => (u.id === me.id ? { ...u, joined: [...u.joined, task.id] } : u)));
  }

  function cancel(task) {
    if (!me) return;
    setUsers((all) => all.map((u) => (u.id === me.id ? { ...u, joined: u.joined.filter((id) => id !== task.id) } : u)));
  }

  function saveTask(data) {
    if (modal?.task) setTasks((all) => all.map((t) => (t.id === modal.task.id ? { ...t, ...data, id: t.id } : t)));
    else setTasks((all) => [{ ...data, id: Date.now() }, ...all]);
    setModal(null);
  }

  function deleteTask(task) {
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;
    setTasks((all) => all.filter((t) => t.id !== task.id));
    setUsers((all) => all.map((u) => ({ ...u, joined: u.joined.filter((id) => id !== task.id) })));
  }

  function deleteUser(user) {
    if (!confirm(`Удалить ученика ${user.first} ${user.last}?`)) return;
    setUsers((all) => all.filter((u) => u.id !== user.id));
  }

  function resetAll() {
    if (!confirm("Вернуть демо-задачи и удалить всех учеников?")) return;
    setTasks(INITIAL_TASKS);
    setUsers([]);
  }

  if (!ready) return null;
  if (!session || (session.type === "user" && !me)) {
    return <AuthScreen users={users} onUser={loginUser} onAdmin={() => setSession({ type: "admin" })} />;
  }

  const filters = ["Все", ...CATEGORIES];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md"><BookOpen size={22} /></div>
            <div>
              <h1 className="text-xl font-bold leading-tight">VolunteerHub</h1>
              <p className="text-xs text-slate-500">Единая школьная система волонтёрства</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {me && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 shadow-sm" title="Ваше цифровое портфолио">
                <Award className="text-emerald-600" size={20} />
                <div className="leading-tight">
                  <div className="text-sm font-bold text-emerald-700">{hoursOf(me)} ч.</div>
                  <div className="text-[11px] text-emerald-600">{me.first} {me.last}</div>
                </div>
              </div>
            )}
            {isAdmin && (
              <>
                <span className="flex items-center gap-1.5 rounded-2xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-700"><Shield size={16} /> Администратор</span>
                <button onClick={() => setModal({ task: null })} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700">
                  <Plus size={18} /> Создать задачу
                </button>
              </>
            )}
            <button onClick={() => setSession(null)} className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-100">
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="mb-5 flex flex-wrap gap-2">
          {[["tasks", "Задачи"], ["users", `Ученики (${users.length})`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-violet-600 text-white" : "bg-white text-slate-600 shadow-sm"}`}>{label}</button>
          ))}
          <button onClick={resetAll} className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50">Сбросить все данные</button>
        </div>
      )}

      {isAdmin && tab === "users" ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md shadow-slate-200/60">
          {users.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Пока никто не зарегистрировался.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="p-3">Ученик</th><th className="p-3">Записан на</th><th className="p-3">Часов</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{u.first} {u.last}</td>
                    <td className="p-3 text-slate-600">{tasks.filter((t) => u.joined.includes(t.id)).map((t) => t.title).join(", ") || "—"}</td>
                    <td className="p-3 font-semibold text-emerald-700">{hoursOf(u)}</td>
                    <td className="p-3 text-right"><button onClick={() => deleteUser(u)} aria-label="Удалить ученика" className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <>
          <section className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию задачи" className={inputCls + " pl-10 shadow-sm"} aria-label="Поиск по названию задачи" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 shadow-sm hover:bg-emerald-50"}`}>{f}</button>
              ))}
            </div>
          </section>

          {visible.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="font-semibold">Ничего не найдено</p>
              <p className="mt-1 text-sm text-slate-500">Измените запрос или категорию.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((t) => {
                const taken = signups(t.id);
                const left = t.total - taken.length;
                const isJoined = !!me && me.joined.includes(t.id);
                return (
                  <article key={t.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-md shadow-slate-200/60">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t.category}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">+{t.hours} ч. волонтёрства</span>
                    </div>
                    <h2 className="mb-2 text-lg font-semibold leading-snug">{t.title}</h2>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">{t.description}</p>
                    <ul className="mb-4 space-y-1.5 text-sm text-slate-500">
                      <li className="flex items-center gap-2"><MapPin size={15} /> {t.location}</li>
                      <li className="flex items-center gap-2"><Clock size={15} /> {formatDate(t.date, t.time)}</li>
                      <li className="flex items-center gap-2"><Users size={15} /> Свободно мест: {left} из {t.total}</li>
                      <li className="flex items-center gap-2"><User size={15} /> {t.author}</li>
                    </ul>
                    {isAdmin ? (
                      <div className="space-y-2">
                        {taken.length > 0 && <p className="text-xs text-slate-500">Записались: {taken.map((u) => `${u.first} ${u.last}`).join(", ")}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ task: t })} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-200"><Pencil size={16} /> Изменить</button>
                          <button onClick={() => deleteTask(t)} className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"><Trash2 size={16} /> Удалить</button>
                        </div>
                      </div>
                    ) : isJoined ? (
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700"><CheckCircle size={18} /> Вы записаны</div>
                        <button onClick={() => cancel(t)} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><Undo2 size={16} /> Отменить</button>
                      </div>
                    ) : (
                      <button onClick={() => join(t)} disabled={left <= 0} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${left <= 0 ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                        {left <= 0 ? "Мест нет" : "Откликнуться"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {modal && <TaskModal initial={modal.task} onSave={saveTask} onClose={() => setModal(null)} />}
    </div>
  );
}
