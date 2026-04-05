/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * ContributeSection: Contact form for researchers, operators, and contributors
 * to submit better data, corrections, new sources, or methodology improvements.
 * Static frontend — form submits via mailto or shows a success state.
 */
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Send,
  FlaskConical,
  Database,
  Bug,
  Lightbulb,
  CheckCircle2,
  User,
  Mail,
  Building2,
  MessageSquare,
  ChevronDown,
  FileText,
  Radio,
  ArrowRight,
  FileDown,
  ExternalLink,
} from "lucide-react";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  CONTRIBUTION TYPES                                                 */
/* ------------------------------------------------------------------ */
const CONTRIBUTION_TYPES = [
  {
    id: "data",
    label: "New Data Source",
    icon: Database,
    description: "Submit a new research paper, benchmark, or dataset we should incorporate",
    color: "teal",
  },
  {
    id: "correction",
    label: "Data Correction",
    icon: Bug,
    description: "Identify an error in our current data or calculations that needs fixing",
    color: "amber",
  },
  {
    id: "methodology",
    label: "Methodology Improvement",
    icon: FlaskConical,
    description: "Propose a better measurement approach, formula, or assumption",
    color: "teal",
  },
  {
    id: "general",
    label: "General Feedback",
    icon: Lightbulb,
    description: "Share insights, partnership ideas, or other suggestions",
    color: "amber",
  },
] as const;

type ContributionType = (typeof CONTRIBUTION_TYPES)[number]["id"];

/* ------------------------------------------------------------------ */
/*  STATS                                                              */
/* ------------------------------------------------------------------ */
const CONTRIBUTION_STATS = [
  { value: "20+", label: "Sources Cited" },
  { value: "6", label: "Model Assumptions" },
  { value: "Open", label: "Methodology" },
  { value: "v2.0", label: "Current Version" },
];

export default function ContributeSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [contributionType, setContributionType] = useState<ContributionType>("data");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const selectedType = CONTRIBUTION_TYPES.find((t) => t.id === contributionType)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const typeLabel = selectedType.label;
    const mailSubject = encodeURIComponent(
      `[AI Energy Impact] ${typeLabel}: ${subject || "Contribution"}`
    );
    const mailBody = encodeURIComponent(
      `Contribution Type: ${typeLabel}\n` +
        `Name: ${name}\n` +
        `Organization: ${organization || "N/A"}\n` +
        `Email: ${email}\n\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`
    );

    window.open(`mailto:contribute@aienergy.impact?subject=${mailSubject}&body=${mailBody}`, "_self");
    setSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setOrganization("");
    setSubject("");
    setMessage("");
    setSubmitted(false);
    setContributionType("data");
  };

  return (
    <section id="contribute" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/20 bg-teal/5 mb-5">
            <Send className="w-3.5 h-3.5 text-teal" />
            <span className="text-xs font-medium text-teal tracking-wide uppercase">
              Open Research
            </span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
            Contribute to Better Data
          </h2>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">
            This dashboard is a living document. If you have access to better data, more rigorous
            measurement approaches, or can identify errors in our assumptions — we want to hear
            from you. The goal is to be{" "}
            <span className="text-teal/80 font-medium">progressively less wrong</span>.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12"
        >
          {CONTRIBUTION_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-navy-light/40 p-4 text-center"
            >
              <div className="font-display font-bold text-xl text-teal">{stat.value}</div>
              <div className="text-[11px] text-white/40 uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Contribution type selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2"
          >
            <h3 className="font-display font-semibold text-sm text-white/70 uppercase tracking-wider mb-4">
              What are you contributing?
            </h3>
            <div className="space-y-3">
              {CONTRIBUTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = contributionType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setContributionType(type.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all duration-200 group ${
                      isSelected
                        ? "border-teal/30 bg-teal/[0.06] shadow-lg shadow-teal/5"
                        : "border-white/[0.06] bg-navy-light/30 hover:border-white/[0.12] hover:bg-navy-light/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? type.color === "teal"
                              ? "bg-teal/15 text-teal"
                              : "bg-amber/15 text-amber"
                            : "bg-white/[0.04] text-white/30 group-hover:text-white/50"
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div
                          className={`font-display font-semibold text-sm transition-colors ${
                            isSelected ? "text-white" : "text-white/60 group-hover:text-white/80"
                          }`}
                        >
                          {type.label}
                        </div>
                        <p
                          className={`text-xs mt-1 leading-relaxed transition-colors ${
                            isSelected ? "text-white/50" : "text-white/30"
                          }`}
                        >
                          {type.description}
                        </p>
                      </div>
                      {/* Selection indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 shrink-0 ml-auto mt-0.5 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-teal bg-teal"
                            : "border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0B1120]" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Guidelines card */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-navy-light/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-white/40" />
                <h4 className="font-display font-semibold text-xs text-white/60 uppercase tracking-wider">
                  Submission Guidelines
                </h4>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Include DOI or URL for any referenced papers",
                  "Specify hardware and inference conditions if submitting energy data",
                  "Note confidence level and known limitations",
                  "Peer-reviewed sources are prioritized but not required",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-white/35 leading-relaxed">
                    <ArrowRight className="w-3 h-3 text-teal/40 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={AICO2_METHODOLOGY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs text-teal/70 hover:text-teal transition-colors font-medium"
              >
                <FileDown className="w-3.5 h-3.5" />
                Review our full AICo2 Methodology (PDF)
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-teal/20 bg-teal/[0.04] p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-teal" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white mb-3">
                    Thank You for Contributing
                  </h3>
                  <p className="text-white/50 max-w-md mx-auto mb-2 text-sm leading-relaxed">
                    Your email client should have opened with the pre-filled message. If it didn't,
                    you can reach us directly at{" "}
                    <span className="text-teal font-medium">contribute@aienergy.impact</span>
                  </p>
                  <p className="text-white/35 text-xs mb-8">
                    Every contribution helps build more accurate, trusted environmental impact data.
                  </p>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-teal/20 text-teal text-sm font-medium hover:bg-teal/[0.06] transition-colors"
                  >
                    Submit Another Contribution
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-white/[0.06] bg-navy-light/30 p-6 sm:p-8"
                >
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        selectedType.color === "teal"
                          ? "bg-teal/15 text-teal"
                          : "bg-amber/15 text-amber"
                      }`}
                    >
                      <selectedType.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-sm text-white">
                      {selectedType.label}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider ml-auto">
                      All fields with * are required
                    </span>
                  </div>

                  <div className="space-y-5">
                    {/* Row: Name + Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                          <User className="w-3 h-3" />
                          Name <span className="text-signal-red">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Dr. Jane Smith"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-teal/30 focus:ring-1 focus:ring-teal/20 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                          <Mail className="w-3 h-3" />
                          Email <span className="text-signal-red">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jane@university.edu"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-teal/30 focus:ring-1 focus:ring-teal/20 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Row: Organization + Subject */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                          <Building2 className="w-3 h-3" />
                          Organization
                        </label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="MIT, Google DeepMind, etc."
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-teal/30 focus:ring-1 focus:ring-teal/20 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                          <FileText className="w-3 h-3" />
                          Subject <span className="text-signal-red">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Updated H100 inference measurements"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-teal/30 focus:ring-1 focus:ring-teal/20 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                        <MessageSquare className="w-3 h-3" />
                        Message <span className="text-signal-red">*</span>
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          contributionType === "data"
                            ? "Describe the data source, include DOI/URL, and note the hardware/conditions used for measurement..."
                            : contributionType === "correction"
                            ? "Identify the specific data point or calculation that needs correction, and provide the corrected value with source..."
                            : contributionType === "methodology"
                            ? "Describe the proposed methodology improvement, why current approach is insufficient, and supporting evidence..."
                            : "Share your feedback, insights, or partnership ideas..."
                        }
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-teal/30 focus:ring-1 focus:ring-teal/20 focus:outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Info note */}
                    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 flex items-start gap-3">
                      <Radio className="w-4 h-4 text-teal/40 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-white/30 leading-relaxed">
                        Submissions are reviewed by our research team. Accepted contributions will
                        be credited in the data sources table. We prioritize peer-reviewed research
                        but welcome all evidence-based input.
                      </p>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[11px] text-white/20 hidden sm:block">
                        Opens your email client with a pre-filled message
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-teal text-[#0B1120] font-display font-semibold text-sm hover:bg-teal/90 transition-all shadow-lg shadow-teal/20 hover:shadow-teal/30 ml-auto"
                      >
                        <Send className="w-4 h-4" />
                        Send Contribution
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom: What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14"
        >
          <h3 className="font-display font-semibold text-sm text-white/50 uppercase tracking-wider mb-5 text-center">
            What Happens Next
          </h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Submit",
                desc: "Send your data, correction, or methodology proposal via the form above.",
              },
              {
                step: "02",
                title: "Review",
                desc: "Our research team evaluates submissions against existing sources and methodology.",
              },
              {
                step: "03",
                title: "Integrate",
                desc: "Accepted contributions are incorporated into the dashboard with full attribution.",
              },
              {
                step: "04",
                title: "Publish",
                desc: "Updated data and methodology changes are reflected in the next version release.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/[0.06] bg-navy-light/30 p-5 relative group hover:border-teal/15 transition-colors"
              >
                <div className="font-data text-[10px] text-teal/40 uppercase tracking-widest mb-3">
                  Step {item.step}
                </div>
                <h4 className="font-display font-semibold text-sm text-white mb-2">{item.title}</h4>
                <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 z-10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
