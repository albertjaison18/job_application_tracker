import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  CodeXml,
  LayoutDashboard,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { api, dateLabel, JOB_TYPES, localDay } from "./api.js";
import Dashboard, { CompanyMark } from "./Dashboard.jsx";

const NoticeContext = createContext(() => {});
const statusClass = (status) => status.toLowerCase();
const statusIcons = {
  Applied: Send,
  Interview: MessageSquare,
  Offer: Sparkles,
  Accepted: CheckCheck,
  Declined: ArrowDownUp,
  Rejected: X,
};

export function Badge({ status }) {
  return (
    <span className={`badge ${statusClass(status)}`}>
      <span />
      {status}
    </span>
  );
}
function Brand({ compact = false }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? "compact" : ""}`}
      aria-label="Trackr home"
    >
      <span className="brand-mark">
        <ArrowDownUp size={23} />
      </span>
      <span>
        trackr<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
function ErrorPanel({ error, retry }) {
  return (
    <div className="error-panel" role="alert">
      <CircleHelp size={23} />
      <div>
        <strong>We couldn’t load that.</strong>
        <p>{error}</p>
      </div>
      {retry && (
        <button className="button small secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Getting everything in order…
    </div>
  );
}
function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal glass"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-title">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const formPage =
    pathname === "/applications/new" || pathname.endsWith("/edit");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const [notice, setNotice] = useState("");
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <NoticeContext.Provider value={setNotice}>
      <div className={`app-shell ${formPage ? "form-page" : ""}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <aside className="sidebar">
          <Brand />
          <div className="sidebar-workspace">
            <span className="workspace-icon">
              <BriefcaseBusiness size={18} />
            </span>
            <div>
              <strong>My workspace</strong>
              <span>Your career, organized</span>
            </div>
          </div>
          <span className="nav-label">WORKSPACE</span>
          <nav>
            <NavLink to="/" end>
              <LayoutDashboard size={18} />
              Overview
            </NavLink>
            <NavLink to="/applications">
              <BriefcaseBusiness size={18} />
              Applications
            </NavLink>
            <NavLink to="/follow-ups">
              <Bell size={18} />
              Follow-ups
            </NavLink>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <div className="mini-spark">
                <Sparkles size={18} />
              </div>
              <h3>One step closer.</h3>
              <p>Every application is a new possibility. Keep going.</p>
              <Link to="/applications/new">
                Make your next move <ArrowUpRight size={16} />
              </Link>
            </div>
            <button className="guide-button" onClick={() => setGuide(true)}>
              <CircleHelp size={18} />
              How Trackr works
              <ArrowUpRight size={14} />
            </button>
            <div className="profile">
              <span className="avatar">ME</span>
              <div>
                <strong>Your workspace</strong>
                <span>Personal job tracker</span>
              </div>
              <span className="online-dot" />
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              Workspace
              <ChevronRight size={13} />
              <span>
                {pathname === "/"
                  ? "Overview"
                  : pathname === "/applications"
                    ? "Applications"
                    : pathname === "/follow-ups"
                      ? "Follow-ups"
                      : pathname.endsWith("/new")
                        ? "Add application"
                        : pathname.endsWith("/edit")
                          ? "Edit application"
                          : "Application details"}
              </span>
            </div>
            <div className="topbar-actions">
              <span className="today-label">
                <CalendarDays size={14} />
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date())}
              </span>
              <a
                className="icon-button"
                href="https://github.com/albertjaison18/job_application_tracker"
                target="_blank"
                rel="noreferrer"
                aria-label="Open project on GitHub"
              >
                <CodeXml size={19} />
              </a>
              <button
                className="icon-button"
                aria-label="How Trackr works"
                onClick={() => setGuide(true)}
              >
                <CircleHelp size={19} />
              </button>
              <span className="top-avatar">ME</span>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/applications" element={<Dashboard />} />
              <Route path="/follow-ups" element={<Dashboard followUpsOnly />} />
              <Route path="/applications/new" element={<ApplicationForm />} />
              <Route
                path="/applications/:id/edit"
                element={<ApplicationForm editing />}
              />
              <Route
                path="/applications/:id"
                element={<ApplicationDetails />}
              />
              <Route
                path="*"
                element={
                  <div className="empty-state glass">
                    <h1>Page not found</h1>
                    <Link to="/" className="button primary">
                      Back to overview
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>
          <footer>
            <span>
              <span className="footer-dot" /> A little more organized. A lot
              more confident.
            </span>
            <span>
              Made for your next chapter <Sparkles size={12} />
            </span>
          </footer>
        </div>
        {notice && (
          <div className="toast" role="status">
            <Check size={18} />
            {notice}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {guide && (
          <Modal
            title="A little clarity for your next chapter"
            onClose={() => setGuide(false)}
          >
            <p className="muted">
              Record an application, keep its details together, and move it
              forward as you hear back.
            </p>
            <div className="workflow-guide">
              <p>
                <Badge status="Applied" />
                <ArrowRight size={15} />
                <Badge status="Interview" />
                <ArrowRight size={15} />
                <Badge status="Offer" />
              </p>
              <p>
                Applied and Interview can also move to Rejected. An Offer can
                move to Accepted or Declined. Those three outcomes are final.
              </p>
              <p>
                <Clock3 size={17} /> Follow-up dates are set seven days after
                you apply. Applied applications are marked overdue after that
                date.
              </p>
              <p>
                <Trash2 size={17} /> Applications in Interview or Offer must
                reach a final outcome before they can be deleted.
              </p>
            </div>
            <button
              className="button primary full"
              onClick={() => setGuide(false)}
            >
              Got it <Check size={16} />
            </button>
          </Modal>
        )}
      </div>
    </NoticeContext.Provider>
  );
}

function useApplication(id) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setData(null);
    setError("");
    api(`/applications/${id}`, { signal: controller.signal })
      .then(setData)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [id, revision]);
  return {
    data,
    setData,
    error,
    reload: () => setRevision((value) => value + 1),
  };
}

function ApplicationDetails() {
  const { id } = useParams();
  const { data: a, setData, error, reload } = useApplication(id);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notify = useContext(NoticeContext);
  const navigate = useNavigate();
  async function changeStatus(event) {
    event.preventDefault();
    setBusy(true);
    setMutationError("");
    try {
      const updated = await api(`/applications/${id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setData(updated);
      setStatus("");
      notify("Status updated. Another step forward.");
    } catch (reason) {
      setMutationError(reason.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setMutationError("");
    try {
      await api(`/applications/${id}`, { method: "DELETE" });
      notify("Application deleted.");
      navigate("/applications");
    } catch (reason) {
      setMutationError(reason.message);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorPanel error={error} retry={reload} />;
  if (!a) return <Loading />;
  return (
    <>
      <Link to="/applications" className="back-link">
        <ArrowLeft size={16} />
        Back to applications
      </Link>
      <div className="page-heading details-heading">
        <div>
          <div className="eyebrow">{a.applicationId}</div>
          <h1>{a.jobRole}</h1>
          <p>
            {a.companyName}
            <span className="inline-dot">·</span>
            {a.jobType}
          </p>
        </div>
        <Link className="button secondary" to={`/applications/${id}/edit`}>
          <Pencil size={16} />
          Edit application
        </Link>
      </div>
      {mutationError && <ErrorPanel error={mutationError} />}
      <div className="details-columns">
        <div>
          <section className="detail-card glass">
            <div className="detail-card-heading">
              <CompanyMark name={a.companyName} />
              <div>
                <h2>{a.companyName}</h2>
                <span className="muted">Application overview</span>
              </div>
              <Badge status={a.status} />
            </div>
            {a.isOverdue && (
              <div className="overdue-banner">
                <Clock3 size={18} />
                <div>
                  <strong>Follow-up Overdue</strong>
                  <p>
                    This application is still Applied. Your follow-up was due{" "}
                    {dateLabel(a.followUpDate)}.
                  </p>
                </div>
              </div>
            )}
            <dl className="detail-fields">
              <div>
                <dt>Application ID</dt>
                <dd className="mono">{a.applicationId}</dd>
              </div>
              <div>
                <dt>Job type</dt>
                <dd>{a.jobType}</dd>
              </div>
              <div>
                <dt>Applied on</dt>
                <dd>{dateLabel(a.appliedDate)}</dd>
              </div>
              <div>
                <dt>Follow-up date</dt>
                <dd>{dateLabel(a.followUpDate)}</dd>
              </div>
              <div>
                <dt>Expected salary</dt>
                <dd>
                  {a.expectedSalary == null
                    ? "Not specified"
                    : new Intl.NumberFormat("en-IN", {
                        maximumFractionDigits: 2,
                      }).format(a.expectedSalary)}
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{dateLabel(a.updatedAt)}</dd>
              </div>
            </dl>
            <div className="notes">
              <h3>
                <FileText size={16} />
                Your notes
              </h3>
              <p>
                {a.notes ||
                  "No notes yet. Add interview prep, recruiter details, or anything you want to remember."}
              </p>
            </div>
          </section>
          <section className="detail-card glass status-section">
            <h2>Update application status</h2>
            <p className="muted">
              Choose the next stage. Only valid transitions are available.
            </p>
            {a.allowedNextStatuses.length ? (
              <form onSubmit={changeStatus} className="status-form">
                <label className="select-wrap">
                  <select
                    aria-label="Next status"
                    required
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={busy}
                  >
                    <option value="">Choose next status</option>
                    {a.allowedNextStatuses.map((next) => (
                      <option key={next}>{next}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </label>
                <button className="button primary" disabled={busy || !status}>
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Update status
                </button>
              </form>
            ) : (
              <div className="final-status">
                <CheckCheck size={19} />
                {a.status} is a final status. This journey is complete.
              </div>
            )}
          </section>
          <div className="delete-section">
            <div>
              <h3>Delete application</h3>
              <p>
                {a.canDelete
                  ? "Permanently remove this application and its history."
                  : `Deletion is unavailable while this application is in ${a.status}.`}
              </p>
            </div>
            <button
              className="button danger"
              disabled={!a.canDelete || busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
        <aside className="detail-card glass timeline-panel">
          <span className="eyebrow">EVERY STEP COUNTS</span>
          <h2>Your application journey</h2>
          <p className="muted">A little history. A lot of progress.</p>
          <ol className="timeline">
            {a.statusHistory.map((entry, index) => {
              const Icon = statusIcons[entry.status];
              return (
                <li
                  key={`${entry.changedAt}-${index}`}
                  className={
                    index === a.statusHistory.length - 1 ? "current" : ""
                  }
                >
                  <span
                    className={`timeline-icon ${statusClass(entry.status)}`}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <strong>{entry.status}</strong>
                    <span>{dateLabel(entry.changedAt)}</span>
                    <small>
                      {new Intl.DateTimeFormat("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(entry.changedAt))}
                    </small>
                    {index === a.statusHistory.length - 1 && (
                      <span className="current-label">Current status</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="timeline-note">
            <Sparkles size={16} />
            Every step is part of your story.
          </div>
        </aside>
      </div>
      {confirmDelete && (
        <Modal
          title="Delete this application?"
          onClose={() => {
            if (!busy) setConfirmDelete(false);
          }}
        >
          <p className="muted">
            This will permanently delete your {a.jobRole} application at{" "}
            {a.companyName}, including its status history.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Keep application
            </button>
            <button
              className="button danger filled"
              disabled={busy}
              onClick={remove}
            >
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              Delete application
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ApplicationForm({ editing = false }) {
  const { id } = useParams();
  const {
    data: original,
    error: loadError,
    reload,
  } = useApplication(editing ? id : null);
  const initial = {
    companyName: "",
    jobRole: "",
    jobType: "Full-time",
    appliedDate: localDay(),
    expectedSalary: "",
    notes: "",
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const notify = useContext(NoticeContext);
  useEffect(() => {
    if (editing && original)
      setValues({
        companyName: original.companyName,
        jobRole: original.jobRole,
        jobType: original.jobType,
        appliedDate: original.appliedDate.slice(0, 10),
        expectedSalary: original.expectedSalary ?? "",
        notes: original.notes,
      });
    else if (!editing) {
      setValues(initial);
      setErrors({});
      setError("");
    }
  }, [editing, original]);
  function field(name) {
    return {
      name,
      id: name,
      value: values[name],
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      onChange: (event) => {
        setValues((previous) => ({ ...previous, [name]: event.target.value }));
        setErrors((previous) => ({ ...previous, [name]: "" }));
      },
    };
  }
  const fieldError = (name) =>
    errors[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]}
      </span>
    ) : null;
  async function submit(event) {
    event.preventDefault();
    const validation = {};
    if (!values.companyName.trim())
      validation.companyName = "Enter the company name.";
    if (!values.jobRole.trim()) validation.jobRole = "Enter the job role.";
    if (!editing && values.appliedDate > localDay())
      validation.appliedDate = "Applied date cannot be in the future.";
    if (
      values.expectedSalary !== "" &&
      (!Number.isFinite(Number(values.expectedSalary)) ||
        Number(values.expectedSalary) < 0)
    )
      validation.expectedSalary = "Enter a non-negative number.";
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    const payload = {
      companyName: values.companyName.trim(),
      jobRole: values.jobRole.trim(),
      jobType: values.jobType,
      expectedSalary:
        values.expectedSalary === "" ? null : Number(values.expectedSalary),
      notes: values.notes.trim(),
      ...(!editing ? { appliedDate: values.appliedDate } : {}),
    };
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const saved = await api(
        editing ? `/applications/${id}` : "/applications",
        { method: editing ? "PUT" : "POST", body: payload },
      );
      notify(
        editing
          ? "Application updated."
          : "Application added. Here’s to what’s next.",
      );
      navigate(`/applications/${saved._id}`);
    } catch (reason) {
      setError(reason.message);
      setErrors(reason.errors || {});
    } finally {
      setBusy(false);
    }
  }
  if (editing && loadError)
    return <ErrorPanel error={loadError} retry={reload} />;
  if (editing && !original) return <Loading />;
  return (
    <>
      <Link
        to={editing ? `/applications/${id}` : "/applications"}
        className="back-link"
      >
        <ArrowLeft size={16} />
        Back to {editing ? "application" : "applications"}
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> {editing ? "KEEP YOUR STORY CURRENT" : "A NEW POSSIBILITY"}
          </div>
          <h1>
            {editing ? "Update your application." : "Add an application."}
          </h1>
          <p>
            {editing
              ? "Keep the details current. Your history stays right where it belongs."
              : "A few details now. A clearer picture of what comes next."}
          </p>
        </div>
      </div>
      <div className="form-columns">
        <form className="application-form glass" onSubmit={submit}>
          <div className="form-section-heading">
            <span className="panel-icon">
              <BriefcaseBusiness size={19} />
            </span>
            <div>
              <h2>{editing ? "Edit application" : "Application details"}</h2>
              <p>
                Fields marked <span className="required">*</span> are required.
              </p>
            </div>
          </div>
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}
          {editing && (
            <div className="readonly-id">
              <span>APPLICATION ID</span>
              <strong>{original.applicationId}</strong>
              <span>This stays with your application.</span>
            </div>
          )}
          <div className="form-grid">
            <label htmlFor="companyName">
              Company name <span className="required">*</span>
              <input
                {...field("companyName")}
                placeholder="e.g. Infosys"
                required
                maxLength={120}
                autoFocus
                disabled={busy}
              />
              {fieldError("companyName")}
            </label>
            <label htmlFor="jobRole">
              Job role <span className="required">*</span>
              <input
                {...field("jobRole")}
                placeholder="e.g. Frontend Developer"
                required
                maxLength={160}
                disabled={busy}
              />
              {fieldError("jobRole")}
            </label>
            <label htmlFor="jobType">
              Job type <span className="required">*</span>
              <span className="form-select">
                <select {...field("jobType")} disabled={busy}>
                  {JOB_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </span>
              {fieldError("jobType")}
            </label>
            <label htmlFor="appliedDate">
              Applied date <span className="required">*</span>
              <input
                {...field("appliedDate")}
                type="date"
                required
                max={localDay()}
                disabled={editing || busy}
              />
              {editing && (
                <span className="field-hint">
                  Applied date can’t be changed after creation.
                </span>
              )}
              {fieldError("appliedDate")}
            </label>
            <label className="span-two" htmlFor="expectedSalary">
              Expected salary <span className="optional">optional</span>
              <input
                {...field("expectedSalary")}
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 600000"
                disabled={busy}
              />
              <span className="field-hint">
                Use a consistent currency and salary period for your
                applications.
              </span>
              {fieldError("expectedSalary")}
            </label>
            <label className="span-two" htmlFor="notes">
              Notes <span className="optional">optional</span>
              <textarea
                {...field("notes")}
                rows={5}
                maxLength={5000}
                placeholder="Recruiter details, a link to the listing, or a few things to remember…"
                disabled={busy}
              />
              <span className="field-hint notes-count">
                {values.notes.length} / 5000
              </span>
              {fieldError("notes")}
            </label>
          </div>
          <div className="form-footer">
            <Link
              className={`button secondary ${busy ? "disabled-link" : ""}`}
              to={editing ? `/applications/${id}` : "/applications"}
            >
              Cancel
            </Link>
            <button className="button primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : editing ? (
                <Check size={17} />
              ) : (
                <Plus size={17} />
              )}{" "}
              {busy ? "Saving…" : editing ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <section className="form-preview glass">
            <span className="eyebrow">APPLICATION PREVIEW</span>
            <div className="preview-top">
              <CompanyMark name={values.companyName.trim() || "Your company"} />
              <Badge status={editing ? original.status : "Applied"} />
            </div>
            <h3>{values.jobRole.trim() || "Your next opportunity"}</h3>
            <p>{values.companyName.trim() || "Company name"}</p>
            <span className="preview-type">
              <BriefcaseBusiness size={14} />
              {values.jobType}
            </span>
            <div className="preview-note">
              <Pencil size={13} />
              Updates as you fill in the form.
            </div>
          </section>
          <section className="form-tip glass">
            <span className="tip-symbol">
              <Sparkles size={25} />
            </span>
            <h3>
              A fresh start,
              <br />
              already organized.
            </h3>
            <p>
              We’ll take care of the little things so you can focus on the next
              big one.
            </p>
            <ul>
              <li>
                <Check size={16} />
                <div>
                  <strong>Your own application ID</strong>
                  <span>Created automatically when you save.</span>
                </div>
              </li>
              <li>
                <Clock3 size={16} />
                <div>
                  <strong>A helpful follow-up date</strong>
                  <span>Set for seven days after you apply.</span>
                </div>
              </li>
              <li>
                <Target size={16} />
                <div>
                  <strong>A clear starting point</strong>
                  <span>Every new application starts as Applied.</span>
                </div>
              </li>
            </ul>
          </section>
          <p className="aside-footnote">Good things start with a first step.</p>
        </aside>
      </div>
    </>
  );
}
