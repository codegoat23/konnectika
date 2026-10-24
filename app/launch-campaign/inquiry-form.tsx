"use client";

import { useState } from "react";
import { ArrowRight, Check, Plus, Send } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/assets/logo-plain.svg";
import { FaFacebook, FaGlobe, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import styles from "./inquiry.module.css";
import { BsSendFill } from "react-icons/bs";

const campaignTypes = ["UGC", "Sponsored Content", "Content Clipping", "Other"];
const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "Other"];
const platformIcons = {
  Instagram: FaInstagram,
  TikTok: FaTiktok,
  YouTube: FaYoutube,
  Facebook: FaFacebook,
  Other: FaGlobe,
};
const industries = ["Fashion", "Beauty", "Food & Beverage", "Technology/Gadgets", "Lifestyle", "Education", "Other"];
const budgets = ["Below TZS 200,000", "TZS 200,000–500,000", "TZS 500,000–1,000,000", "TZS 1,000,000–3,000,000", "Above TZS 3,000,000", "Not sure yet"];

type Status = "idle" | "submitting" | "success" | "error";

export default function InquiryForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [openSection, setOpenSection] = useState("brand");
  const [startDate, setStartDate] = useState<Date>();
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  function updateSectionCompletion(form: HTMLFormElement) {
    const completed: Record<string, boolean> = {};
    form.querySelectorAll<HTMLElement>("[data-form-section]").forEach((section) => {
      const requiredFields = Array.from(section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[required], select[required], textarea[required]"));
      const fieldsAreValid = requiredFields.every((field) => field.checkValidity());
      const campaignChoicesAreValid = !section.querySelector('input[name="campaignTypes"]') || !!section.querySelector('input[name="campaignTypes"]:checked');
      const platformChoicesAreValid = !section.querySelector('input[name="platforms"]') || !!section.querySelector('input[name="platforms"]:checked');
      completed[section.dataset.formSection!] = requiredFields.length > 0 && fieldsAreValid && campaignChoicesAreValid && platformChoicesAreValid;
    });
    setCompletedSections(completed);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const form = event.currentTarget;
    const invalidField = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(":invalid");
    if (invalidField) {
      const section = invalidField.closest<HTMLElement>("[data-form-section]");
      if (section?.dataset.formSection) {
        setOpenSection(section.dataset.formSection);
        requestAnimationFrame(() => invalidField.reportValidity());
      }
      return;
    }
    const campaignSelection = form.querySelector<HTMLInputElement>('input[name="campaignTypes"]');
    const platformSelection = form.querySelector<HTMLInputElement>('input[name="platforms"]');
    const hasCampaign = form.querySelector('input[name="campaignTypes"]:checked');
    const hasPlatform = form.querySelector('input[name="platforms"]:checked');
    if (campaignSelection && platformSelection && (!hasCampaign || !hasPlatform)) {
      setStatus("error");
      setMessage(!hasCampaign ? "Choose at least one campaign type." : "Choose at least one platform.");
      setOpenSection("campaign");
      return;
    }
    setStatus("submitting");
    setMessage("");
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());
    body.campaignTypes = data.getAll("campaignTypes").join(", ");
    body.platforms = data.getAll("platforms").join(", ");
    try {
      const response = await fetch("/api/brand-campaign-inquiry", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't send your inquiry. Please try again.");
      setStatus("success");
      setMessage("Thanks for reaching out. Our team will review your campaign and contact you to discuss the next steps.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't send your inquiry. Please try again.");
    }
  }

  if (status === "success") return <section className={styles.shell}><div className={styles.success} role="status"><span className={styles.successIcon}><Check size={24} /></span><p className={styles.eyebrow}>INQUIRY SENT</p><h1>Let’s make something<br />people remember.</h1><p>{message}</p><a href="/" className={styles.submit}>Back to Konnectika <ArrowRight size={16} /></a></div></section>;

  return <section className={styles.shell}>
    <header className={styles.header}>
      <a href="/" className={styles.brand}><Image src={Logo} alt="" width={36} height={36} /></a>
      <h1>Let’s create <br /><span>an impact.</span></h1>
      <p className={styles.intro}>Tell us what you’re working on. We’ll help you find the creators who can bring it to life.</p>
    </header>

    <form className={styles.form} onSubmit={submit} onChange={(event) => updateSectionCompletion(event.currentTarget)} noValidate>
      <section className={styles.accordionItem} data-form-section="brand">
        <button type="button" className={styles.sectionToggle} aria-expanded={openSection === "brand"} aria-controls="brand-details-panel" onClick={() => setOpenSection(openSection === "brand" ? "" : "brand")}><span className={styles.sectionNumber}>01</span><span className={styles.sectionLabel}><strong>Brand details</strong></span><span className={`${styles.toggleIcon} ${openSection !== "brand" && completedSections.brand ? styles.toggleIconComplete : ""}`} aria-hidden="true">{openSection === "brand" ? "×" : completedSections.brand ? <Check size={16} strokeWidth={3} /> : <Plus size={18} />}</span></button>
        <div id="brand-details-panel" className={styles.sectionContent} hidden={openSection !== "brand"}>
      <div className={styles.grid}>
        <label>Brand or business name <b >*</b><input name="brandName" autoComplete="organization" placeholder="e.g. The Good Company" required maxLength={120} /></label>
        <label>Contact person <b>*</b><input name="contactName" autoComplete="name" placeholder="Your full name" required maxLength={120} /></label>
        <label>Business email <b>*</b><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} /></label>
        <label>WhatsApp number <b>*</b><input name="whatsapp" type="tel" autoComplete="tel" defaultValue="+255 " placeholder="+255 7XX XXX XXX" required maxLength={24} pattern="[+0-9() .-]{7,24}" /></label>
        <label>Website or Instagram <span className={styles.optional}>OPTIONAL</span><input name="website" type="text" placeholder="yourbrand.co.tz or @yourbrand" maxLength={250} /></label>
        <label>Industry <b>*</b><Select name="industry" required><SelectTrigger className={styles.selectTrigger}><SelectValue placeholder="Select an industry" /></SelectTrigger><SelectContent className={styles.selectContent}>{industries.map((x) => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></label>
      </div>
        </div>
      </section>
      <section className={styles.accordionItem} data-form-section="campaign">
        <button type="button" className={styles.sectionToggle} aria-expanded={openSection === "campaign"} aria-controls="campaign-details-panel" onClick={() => setOpenSection(openSection === "campaign" ? "" : "campaign")}><span className={styles.sectionNumber}>02</span><span className={styles.sectionLabel}><strong>Campaign details</strong></span><span className={`${styles.toggleIcon} ${openSection !== "campaign" && completedSections.campaign ? styles.toggleIconComplete : ""}`} aria-hidden="true">{openSection === "campaign" ? "×" : completedSections.campaign ? <Check size={16} strokeWidth={3} /> : <Plus size={18} />}</span></button>
        <div id="campaign-details-panel" className={styles.sectionContent} hidden={openSection !== "campaign"}>
      <fieldset><legend>What kind of collaboration? <b>*</b><span className={styles.helper}>Select all that apply</span></legend><div className={styles.choices}>{campaignTypes.map((x) => <label className={`${styles.choice} ${styles.platformChoice}`} key={x}><input type="checkbox" name="campaignTypes" value={x} />{x}</label>)}</div></fieldset>
      <div className={styles.grid}>
        <label>Campaign objective <b>*</b><Select name="objective" required><SelectTrigger className={styles.selectTrigger}><SelectValue placeholder="Choose your main goal" /></SelectTrigger><SelectContent className={styles.selectContent}>{["Brand awareness", "Increase sales", "Promote a product launch", "Generate leads", "Create content for social media", "Other"].map((x) => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></label>
        <label>Product or service to promote <b>*</b><input name="product" placeholder="What should creators know about?" required maxLength={180} /></label>
      </div>
      <label className={styles.block}>Campaign description & expectations <b>*</b><textarea name="description" rows={4} placeholder="Tell us about the campaign, your audience, deliverables, and what success looks like." required minLength={20} maxLength={4000} /></label>
      <label className={styles.block}>Campaign requirements <span className={styles.optional}>OPTIONAL</span><textarea name="requirements" rows={4} placeholder="Share required deliverables, creator qualifications, key messages, hashtags, or anything creators must include." maxLength={4000} /></label>
      <fieldset>
        <legend>Preferred social platforms <b>*</b><span className={styles.helper}>Select all that apply</span></legend><div className={styles.choices}>{platforms.map((x) => { const Icon = platformIcons[x as keyof typeof platformIcons]; return <label className={`${styles.choice} ${styles.platformChoice}`} key={x}><input type="checkbox" name="platforms" value={x} /><Icon aria-hidden="true" size={14} />{x}</label>; })}</div></fieldset>
        </div>
      </section>

      <section className={styles.accordionItem} data-form-section="budget">
        <button type="button" className={styles.sectionToggle} aria-expanded={openSection === "budget"} aria-controls="budget-details-panel" onClick={() => setOpenSection(openSection === "budget" ? "" : "budget")}><span className={styles.sectionNumber}>03</span><span className={styles.sectionLabel}><strong>Budget & timeline</strong></span><span className={`${styles.toggleIcon} ${openSection !== "budget" && completedSections.budget ? styles.toggleIconComplete : ""}`} aria-hidden="true">{openSection === "budget" ? "×" : completedSections.budget ? <Check size={16} strokeWidth={3} /> : <Plus size={18} />}</span></button>
        <div id="budget-details-panel" className={styles.sectionContent} hidden={openSection !== "budget"}>
      <div className={styles.grid}>
        <label>Estimated campaign budget <b>*</b><Select name="budget" required><SelectTrigger className={styles.selectTrigger}><SelectValue placeholder="Select a TZS range" /></SelectTrigger><SelectContent className={styles.selectContent}>{budgets.map((x) => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></label>
        <label>Number of creators <span className={styles.optional}>OPTIONAL</span><Select name="creatorCount"><SelectTrigger className={styles.selectTrigger}><SelectValue placeholder="Not decided" /></SelectTrigger><SelectContent className={styles.selectContent}>{["1", "2–5", "6–10", "10+"].map((x) => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></label>
        <label>Preferred campaign start <span className={styles.optional}>OPTIONAL</span><input type="hidden" name="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ""} /><Popover><PopoverTrigger asChild><Button type="button" variant="outline" aria-label="Preferred campaign start" className={styles.dateTrigger}>{startDate ? format(startDate, "PPP") : <span className={styles.datePlaceholder}>Select a date</span>}<CalendarDays aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className={styles.datePopover} align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} autoFocus /></PopoverContent></Popover></label>
      </div>
      <label className={styles.block}>Anything else we should know? <span className={styles.optional}>OPTIONAL</span><textarea name="additional" rows={3} placeholder="Special requirements, timing, or questions…" maxLength={2000} /></label>
        </div>
      </section>
      <div className={styles.trap} aria-hidden="true"><label>Leave this field empty<input name="websiteConfirm" tabIndex={-1} autoComplete="off" /></label></div>
      {message &&
       <p className={styles.error} role="alert">{message}</p>}
      <div className={styles.formFooter}>
        <p>By submitting, you’re asking our team to contact you about this campaign. No payment is taken here.</p>
      <button className={styles.submit} disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Submit Campaign Inquiry"}<BsSendFill size={16} /></button></div>
    </form>
    <footer className={styles.footer}>Have a quick question? <a href="mailto:hello@konnectika.com">Talk to our team <ArrowRight size={13} /></a><small>© {new Date().getFullYear()} Konnectika</small></footer>
  </section>;
}
