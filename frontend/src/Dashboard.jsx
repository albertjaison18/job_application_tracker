import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { api, dateLabel, STATUSES } from "./api.js";

const icons = {
  Applied: Send,
  Interview: MessageSquare,
  Offer: Sparkles,
  Accepted: CheckCheck,
  Declined: ArrowDownUp,
  Rejected: X,
};
const captions = {
  Applied: "Awaiting a reply",
  Interview: "Conversations in progress",
  Offer: "Offers to review",
  Accepted: "A new chapter",
  Declined: "Offers declined",
  Rejected: "Closed applications",
};
const colors = {
  Applied: "#7399ce",
  Interview: "#dfb464",
  Offer: "#a596d3",
  Accepted: "#69a88b",
  Declined: "#a1acb6",
  Rejected: "#d9999e",
};

export function CompanyMark({ name, small = false }) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`company-mark mark-${hue} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function Badge({ status }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}

function ApplicationCard({ application: a }) {
  return (
    <article className="application-card glass">
      <div className="card-top">
        <CompanyMark name={a.companyName} />
        <div className="card-company">
          <strong>{a.companyName}</strong>
          <span className="application-id">{a.applicationId}</span>
        </div>
        <Badge status={a.status} />
      </div>
      <Link to={`/applications/${a._id}`} className="card-title">
        <h3>{a.jobRole}</h3>
      </Link>
      <div className="card-tags">
        <span>
          <BriefcaseBusiness size={13} />
          {a.jobType}
        </span>
        {a.isOverdue && (
          <span className="overdue-badge">
            <Clock3 size={12} />
            Follow-up Overdue
          </span>
        )}
      </div>
      <div className="card-dates">
        <span>
          <CalendarDays size={14} />
          <span>
            Applied <strong>{dateLabel(a.appliedDate)}</strong>
          </span>
        </span>
        {a.status === "Applied" && (
          <span className={a.isOverdue ? "due-warning" : ""}>
            <Clock3 size={14} />
            <span>
              Follow up <strong>{dateLabel(a.followUpDate)}</strong>
            </span>
          </span>
        )}
      </div>
      <div className="card-bottom">
        <Link
          to={`/applications/${a._id}`}
          aria-label={`View ${a.jobRole} at ${a.companyName}`}
        >
          View application
          <ArrowUpRight size={16} />
        </Link>
        <Link
          className="card-edit"
          to={`/applications/${a._id}/edit`}
          aria-label={`Edit ${a.jobRole} at ${a.companyName}`}
        >
          <Pencil size={15} />
        </Link>
      </div>
    </article>
  );
}

function OverviewBento({ data, total, overdue, error }) {
  const active = data
    ? data.stats.Applied + data.stats.Interview + data.stats.Offer
    : 0;
  return (
    <section className="overview-bento" aria-label="Workspace highlights">
      <div className="hero glass">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={15} />A LITTLE CLARITY. A LOT OF POSSIBILITY.
          </span>
          <h2>
            Small steps.
            <br />
            <span>Big possibilities.</span>
          </h2>
          <p>
            Every opportunity, every next step.
            <br />
            Make space for the chapter ahead.
          </p>
          <Link to="/applications" className="hero-link">
            Explore your applications <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="opportunity-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-orbit second" />
          <span className="art-star">✧</span>
          <div className="opportunity-stack stack-back">
            <MessageSquare size={18} />
            <span>In conversation</span>
            <strong>{data ? data.stats.Interview : "—"}</strong>
          </div>
          <div className="opportunity-stack stack-front">
            <span className="stack-icon">
              <BriefcaseBusiness size={23} />
            </span>
            <span>YOUR NEXT CHAPTER</span>
            <strong>
              {data ? active : "—"}
              <small> active opportunities</small>
            </strong>
            <div className="mini-progress">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="stack-chip">
            <Sparkles size={14} />
            {data ? data.stats.Offer : "—"} offer
            {data?.stats.Offer === 1 ? "" : "s"} to explore
          </div>
        </div>
        <span className="hero-corner">
          MADE FOR YOUR NEXT MOVE <ArrowUpRight size={13} />
        </span>
      </div>
      <div className="focus-card">
        <div className="focus-top">
          <span className="focus-icon">
            <Bell size={19} />
          </span>
          <span className={`focus-label ${overdue.length ? "attention" : ""}`}>
            {!data
              ? "YOUR NEXT STEP"
              : overdue.length
                ? "NEEDS A LITTLE ATTENTION"
                : "LOOKING GOOD"}
          </span>
        </div>
        <div className="focus-number">
          {data ? String(overdue.length).padStart(2, "0") : "—"}
          <span>
            <ArrowUpRight size={30} />
          </span>
        </div>
        <h2>
          {!data
            ? "Your follow-up overview"
            : overdue.length
              ? `Follow-up${overdue.length === 1 ? "" : "s"} overdue`
              : "You’re all caught up."}
        </h2>
        <p>
          {error
            ? "Reconnect to see which applications need a follow-up."
            : !data
              ? "Checking your applications…"
              : overdue.length
                ? `${overdue.length === 1 ? "An opportunity is" : `${overdue.length} opportunities are`} waiting for your next move. A small nudge can make a difference.`
                : total
                  ? "No overdue follow-ups. Keep your application stages up to date."
                  : "Add your first application. We’ll help you keep track of what’s next."}
        </p>
        <Link
          to={data && !total ? "/applications/new" : "/follow-ups"}
          className="focus-link"
        >
          {data && !total ? "Add an application" : "Review follow-ups"}
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

function PipelinePanel({ data, total }) {
  let end = 0;
  const segments = STATUSES.map((status) => {
    const start = end;
    end += total && data ? (data.stats[status] / total) * 100 : 0;
    return `${colors[status]} ${start}% ${end}%`;
  });
  return (
    <section className="pipeline-panel glass">
      <div className="panel-heading">
        <span className="panel-icon">
          <Target size={18} />
        </span>
        <h3>The bigger picture</h3>
      </div>
      <p className="panel-description">
        A little perspective on your progress.
      </p>
      <div
        className="pipeline-ring"
        style={{
          background: total
            ? `conic-gradient(${segments.join(", ")})`
            : "#e7eeea",
        }}
        role="img"
        aria-label={`${data ? total : "Loading"} total applications`}
      >
        <div>
          <strong>{data ? total : "—"}</strong>
          <span>applications</span>
        </div>
      </div>
      <div className="pipeline-legend">
        {STATUSES.filter((status) => data && data.stats[status] > 0).map(
          (status) => (
            <span key={status}>
              <i style={{ background: colors[status] }} />
              {status}
              <strong>{data.stats[status]}</strong>
            </span>
          ),
        )}
        {data && !total && (
          <p>Your pipeline will grow with your first application.</p>
        )}
      </div>
      <div className="pipeline-bottom">
        <span>
          <Sparkles size={15} />
          Offers & accepted
        </span>
        <strong>{data ? data.stats.Offer + data.stats.Accepted : "—"}</strong>
      </div>
    </section>
  );
}

export default function Dashboard({ followUpsOnly = false }) {
  const { pathname } = useLocation();
  const overview = pathname === "/";
  const [params, setParams] = useSearchParams();
  const company = params.get("company") || "";
  const status = params.get("status") || "";
  const [search, setSearch] = useState(company);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("newest");
  useEffect(() => setSearch(company), [company]);
  useEffect(
    () => setSort(followUpsOnly ? "followup" : "newest"),
    [followUpsOnly],
  );
  useEffect(() => {
    if (search === company) return;
    const timer = setTimeout(
      () =>
        setParams(
          (previous) => {
            const next = new URLSearchParams(previous);
            search.trim()
              ? next.set("company", search.trim())
              : next.delete("company");
            return next;
          },
          { replace: true },
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, company, setParams]);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setLoading(true);
    const query = new URLSearchParams();
    if (company) query.set("company", company);
    if (followUpsOnly) query.set("status", "Applied");
    else if (status) query.set("status", status);
    Promise.all([
      api(`/applications?${query}`, { signal: controller.signal }),
      api("/applications/stats", { signal: controller.signal }),
      api("/applications?status=Applied", { signal: controller.signal }),
    ])
      .then(([applications, stats, followUps]) => {
        if (!controller.signal.aborted) {
          setData({ applications, stats, followUps });
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [company, status, revision, followUpsOnly]);
  const setStatus = (value) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      value ? next.set("status", value) : next.delete("status");
      return next;
    });
  const clearFilters = () => {
    setSearch("");
    setParams({});
  };
  const total = data
    ? Object.values(data.stats).reduce((sum, count) => sum + count, 0)
    : 0;
  const applications = data
    ? [...data.applications].sort((a, b) =>
        sort === "company"
          ? a.companyName.localeCompare(b.companyName)
          : sort === "oldest"
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : sort === "followup"
              ? new Date(a.followUpDate) - new Date(b.followUpDate)
              : new Date(b.createdAt) - new Date(a.createdAt),
      )
    : [];
  const followUps = data
    ? [...data.followUps].sort(
        (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate),
      )
    : [];
  const overdue = followUps.filter((application) => application.isOverdue);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            {followUpsOnly
              ? "A LITTLE NUDGE GOES A LONG WAY"
              : overview
                ? "YOUR CAREER WORKSPACE"
                : "YOUR OPPORTUNITIES, IN ONE PLACE"}
          </div>
          <h1>
            {followUpsOnly
              ? "Keep the conversation going."
              : overview
                ? "Your next move, organized."
                : "Your applications."}
          </h1>
          <p>
            {followUpsOnly
              ? "Know who to check in with, and when. Your oldest follow-ups come first."
              : overview
                ? "A clearer view of where you are. A little more confidence in what’s next."
                : "Find an opportunity, update its progress, and keep your next step in sight."}
          </p>
        </div>
        <Link to="/applications/new" className="button primary">
          <Plus size={19} />
          Add application
        </Link>
      </div>
      {overview && (
        <OverviewBento
          data={data}
          total={total}
          overdue={overdue}
          error={error}
        />
      )}
      {!followUpsOnly && (
        <section
          className="stats-grid"
          aria-label="Filter applications by status"
        >
          {STATUSES.map((name) => {
            const Icon = icons[name];
            return (
              <button
                key={name}
                className={`stat-card glass ${status === name ? "selected" : ""}`}
                onClick={() => setStatus(status === name ? "" : name)}
                aria-pressed={status === name}
                aria-label={`${name}: ${data ? data.stats[name] : "loading"} application${data?.stats[name] === 1 ? "" : "s"}. Filter by ${name}`}
              >
                <div className="stat-top">
                  <span className={`stat-icon ${name.toLowerCase()}`}>
                    <Icon size={17} />
                  </span>
                  <strong>{data ? data.stats[name] : "—"}</strong>
                </div>
                <span className="stat-name">{name}</span>
                <span className="stat-bottom">{captions[name]}</span>
              </button>
            );
          })}
        </section>
      )}
      {followUpsOnly && data && (
        <div className="followup-summary glass">
          <span className="panel-icon">
            <Bell size={19} />
          </span>
          <div>
            <strong>
              {overdue.length
                ? `${overdue.length} overdue follow-up${overdue.length === 1 ? "" : "s"}`
                : "No overdue follow-ups"}
            </strong>
            <p>
              {followUps.length} application{followUps.length === 1 ? "" : "s"}{" "}
              still awaiting a response.
            </p>
          </div>
          {overdue.length > 0 && (
            <span className="overdue-badge">Needs attention</span>
          )}
        </div>
      )}
      <div className="dashboard-columns">
        <section className="applications-section" aria-busy={loading}>
          <div className="section-heading">
            <div>
              <div className="section-title">
                <h2>
                  {followUpsOnly
                    ? "Follow-up list"
                    : overview
                      ? "Recent applications"
                      : "All applications"}
                </h2>
                <span className="count-pill">
                  {data ? (followUpsOnly ? applications.length : total) : "—"}
                </span>
                {loading && data && (
                  <span className="updating" role="status">
                    <LoaderCircle size={13} className="spin" />
                    Updating
                  </span>
                )}
              </div>
              <p>
                {followUpsOnly
                  ? "Sorted by the next action you need to take."
                  : "A little progress, one opportunity at a time."}
              </p>
            </div>
            <div className="view-switch" aria-label="Application layout">
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-label="Card view"
                aria-pressed={view === "grid"}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <List size={19} />
              </button>
            </div>
          </div>
          <div className="filters glass">
            <label className="search-box">
              <Search size={18} />
              <input
                aria-label="Search by company"
                placeholder="Search by company…"
                value={search}
                maxLength={120}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  className="clear-search"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </label>
            {!followUpsOnly && (
              <label className="select-wrap">
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </label>
            )}
            <label className="select-wrap sort-select">
              <ArrowDownUp size={15} />
              <select
                aria-label="Sort applications"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {followUpsOnly && (
                  <option value="followup">Follow-up date</option>
                )}
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company A–Z</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          {(company || (!followUpsOnly && status)) && (
            <div className="active-filters">
              <span>Filtered by</span>
              {company && (
                <button
                  onClick={() => setSearch("")}
                  aria-label={`Remove company filter ${company}`}
                >
                  <Search size={12} />
                  {company}
                  <X size={12} />
                </button>
              )}
              {status && !followUpsOnly && (
                <button
                  onClick={() => setStatus("")}
                  aria-label={`Remove status filter ${status}`}
                >
                  {status}
                  <X size={12} />
                </button>
              )}
              <button className="reset-filters" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
          {error ? (
            <div className="error-panel" role="alert">
              <Bell size={21} />
              <div>
                <strong>We couldn’t load your applications.</strong>
                <p>{error}</p>
              </div>
              <button
                className="button small secondary"
                onClick={() => setRevision((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          ) : !data ? (
            <div className="loading" role="status">
              <LoaderCircle className="spin" size={22} />
              Loading your workspace…
            </div>
          ) : applications.length ? (
            <>
              <div
                className={`application-grid ${view === "list" ? "list-view" : ""}`}
              >
                {applications.map((application) => (
                  <ApplicationCard
                    key={application._id}
                    application={application}
                  />
                ))}
              </div>
              <div className="results-note">
                <span className="footer-dot" />
                Showing {applications.length}
                {!followUpsOnly && applications.length !== total
                  ? ` of ${total}`
                  : ""}{" "}
                application
                {(!followUpsOnly && applications.length !== total
                  ? total
                  : applications.length) === 1
                  ? ""
                  : "s"}
                {status && !followUpsOnly ? ` · ${status}` : ""}
              </div>
            </>
          ) : (
            <div className="empty-state glass">
              <span className="empty-icon">
                <BriefcaseBusiness size={30} />
              </span>
              <h3>
                {company || status
                  ? "No matching opportunities."
                  : followUpsOnly
                    ? "Your follow-up list is clear."
                    : "Start your next chapter."}
              </h3>
              <p>
                {company || status
                  ? "Try another company name or clear your filters to see all applications."
                  : followUpsOnly
                    ? "Applications appear here while you’re waiting for a response."
                    : "Your first application is the first step. Add one to bring your job search into focus."}
              </p>
              {company || status ? (
                <button className="button secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                !followUpsOnly && (
                  <Link className="button primary" to="/applications/new">
                    <Plus size={17} />
                    Add your first application
                  </Link>
                )
              )}
            </div>
          )}
        </section>
        <aside className="right-column">
          <section className="followup-panel glass">
            <div className="panel-heading">
              <span className="panel-icon">
                <Clock3 size={18} />
              </span>
              <h3>On your radar</h3>
              <span className="tiny-dot" />
            </div>
            <p className="panel-description">Your next check-ins, in order.</p>
            {data ? (
              followUps.length ? (
                <div className="followup-items">
                  {followUps.slice(0, 3).map((application) => (
                    <Link
                      to={`/applications/${application._id}`}
                      key={application._id}
                      className="followup-item"
                    >
                      <CompanyMark name={application.companyName} small />
                      <div>
                        <strong>{application.companyName}</strong>
                        <span>{application.jobRole}</span>
                        <small
                          className={
                            application.isOverdue ? "overdue-text" : ""
                          }
                        >
                          <Clock3 size={12} />
                          {application.isOverdue
                            ? "Follow-up overdue"
                            : dateLabel(application.followUpDate)}
                        </small>
                      </div>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="radar-empty">
                  <Check size={24} />
                  <strong>Nothing waiting on you.</strong>
                  <p>New applications will appear here.</p>
                </div>
              )
            ) : (
              <div className="radar-empty">
                <p>
                  {error
                    ? "Check your connection to load follow-ups."
                    : "Checking your next steps…"}
                </p>
              </div>
            )}
            <Link to="/follow-ups" className="panel-link">
              All follow-ups
              <ArrowUpRight size={17} />
            </Link>
          </section>
          <PipelinePanel data={data} total={total} />
          <div className="workspace-note">
            <Sparkles size={16} />
            <p>
              Every application is a step forward.
              <br />
              <strong>You’ve got this.</strong>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
