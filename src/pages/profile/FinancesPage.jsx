// src/pages/profile/FinancesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import ProfileSectionLayout from "../../components/profile/ProfileSectionLayout";
import SectionTextWhite from "../../components/common/SectionTextWhite";
import { getAppointmentsByUserId } from "../../services/appointmentService";
import { getSubscriptionsByUserId } from "../../services/subscriptionService";
import {
  CurrencyEuroIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/**
 * Simple finances detail page that matches the styling of other profile pages.
 * Data is derived from what the user has already spent on this website
 * (consultations + subscriptions). Pitch deck pricing isn't available yet,
 * so it's shown as a count only for now.
 *
 * Make sure your router includes a route for "/profile/finances" that renders this component.
 */
export default function FinancesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // Same plan pricing heuristic used elsewhere
  const PLAN_PRICING = {
    basic: 40,
    standard: 90,
    premium: 230,
  };

  const formatCurrency = (amount, currency = "EUR") => {
    const locale = i18n?.resolvedLanguage || i18n?.language || undefined;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(amount ?? 0);
    } catch {
      return `${(amount ?? 0).toFixed(2)} ${currency}`;
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const [{ data: appts, error: apptErr }, { data: subs, error: subErr }] = await Promise.all([
          getAppointmentsByUserId(user.id),
          getSubscriptionsByUserId(user.id),
        ]);
        if (apptErr) throw apptErr;
        if (subErr) throw subErr;
        if (!ignore) {
          setAppointments(appts || []);
          setSubscriptions(subs || []);
        }
      } catch (e) {
        console.error("Finances load error:", e);
        if (!ignore) setError(t("finances.details.error", "Failed to load finances."));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [user?.id, t]);

  /** Derived totals **/
  const totals = useMemo(() => {
    // Appointments: prefer explicit price; otherwise duration * 1.5 (same fallback used in ProfilePage)
    const consultations = (appointments || []).map((a) => {
      const price = typeof a.price === "number" && !Number.isNaN(a.price)
        ? a.price
        : (a.duration_minutes || 0) * 1.5;
      return { ...a, __amount: price };
    });
    const consultationsTotal = consultations.reduce((s, a) => s + (a.__amount || 0), 0);

    // Subscriptions: infer price from plan_id when possible
    const subs = (subscriptions || []).map((s) => {
      const planId = (s.plan_id || "").toLowerCase();
      const price = PLAN_PRICING[planId] || 0;
      return { ...s, __amount: price };
    });
    const subscriptionsTotal = subs.reduce((s, x) => s + (x.__amount || 0), 0);

    const grand = consultationsTotal + subscriptionsTotal;

    return {
      consultations: { items: consultations, total: consultationsTotal },
      subscriptions: { items: subs, total: subscriptionsTotal },
      grand,
    };
  }, [appointments, subscriptions]);

  const Skeleton = () => (
    <div className="space-y-3">
      <div className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      <div className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      <div className="h-48 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, hint }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-white/80" />
          <div className="text-sm font-medium text-white/90">{label}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{value}</div>
          {hint && <div className="text-xs text-white/70">{hint}</div>}
        </div>
      </div>
    </div>
  );

  const Table = ({ columns, rows, emptyLabel }) => (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* mobile: cards */}
      <div className="grid gap-3 p-3 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-4 text-center text-white/70">{emptyLabel}</div>
        ) : (
          rows.map((r, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 p-3">
              {columns.map((c) => (
                <div key={c.key} className="flex items-center justify-between py-1 text-sm">
                  <div className="text-white/70">{c.header}</div>
                  <div className="text-white">{r[c.key]}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {/* desktop: table */}
      <div className="hidden sm:block">
        <table className="min-w-full text-sm text-white/90">
          <thead className="bg-white/5 text-white/70">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 text-left font-medium">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={columns.length}>{emptyLabel}</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-t border-white/10">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">{r[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Prepare rows
  const consultationRows = useMemo(() => {
    return totals.consultations.items.map((a) => ({
      date: a.created_at ? new Date(a.created_at).toLocaleString() : "—",
      duration: `${a.duration_minutes ?? 0} min`,
      status: a.status || t("finances.details.status.confirmed", "Confirmed"),
      amount: formatCurrency(a.__amount),
    }));
  }, [totals.consultations.items, t]);

  const subscriptionRows = useMemo(() => {
    return totals.subscriptions.items.map((s) => {
      const planName = s.plan_id || t("finances.details.subscription", "Subscription");
      const status = s.status || t("finances.details.status.active", "Active");
      const price = formatCurrency(s.__amount);
      const since = s.created_at ? new Date(s.created_at).toLocaleDateString() : "—";
      return { plan: planName, status, price, since };
    });
  }, [totals.subscriptions.items, t]);

  return (
    <div className="bg-[#002147] min-h-[85vh]">
      <ProfileSectionLayout>
        <SectionTextWhite title={t("finances.details.title", "Your Finances")} />

        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-200">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Totals */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatCard
                icon={CurrencyEuroIcon}
                label={t("finances.details.totalSpent", "Total spent")}
                value={formatCurrency(totals.grand)}
                hint={t("finances.details.includes", "Consultations + Subscriptions")}
              />
              <StatCard
                icon={CalendarIcon}
                label={t("finances.details.consultationsSpent", "Consultations")}
                value={formatCurrency(totals.consultations.total)}
                hint={`${consultationRows.length} ${t("finances.details.sessions", "sessions")}`}
              />
              <StatCard
                icon={CreditCardIcon}
                label={t("finances.details.subscriptionsSpent", "Subscriptions")}
                value={formatCurrency(totals.subscriptions.total)}
                hint={`${subscriptionRows.length} ${t("finances.details.activeOrPast", "active/past")}`}
              />
            </div>

            {/* Consultations table */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ClockIcon className="h-5 w-5" />
                {t("finances.details.consultationsHeading", "Consultation history")}
              </h3>
              <Table
                columns={[
                  { key: "date", header: t("finances.details.cols.date", "Date") },
                  { key: "duration", header: t("finances.details.cols.duration", "Duration") },
                  { key: "status", header: t("finances.details.cols.status", "Status") },
                  { key: "amount", header: t("finances.details.cols.amount", "Amount") },
                ]}
                rows={consultationRows}
                emptyLabel={t("finances.details.noConsultations", "No consultations yet.")}
              />
            </section>

            {/* Subscriptions table */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <CreditCardIcon className="h-5 w-5" />
                {t("finances.details.subscriptionsHeading", "Subscriptions")}
              </h3>
              <Table
                columns={[
                  { key: "plan", header: t("finances.details.cols.plan", "Plan") },
                  { key: "status", header: t("finances.details.cols.status", "Status") },
                  { key: "since", header: t("finances.details.cols.since", "Since") },
                  { key: "price", header: t("finances.details.cols.price", "Price") },
                ]}
                rows={subscriptionRows}
                emptyLabel={t("finances.details.noSubscriptions", "No subscriptions yet.")}
              />
            </section>
          </div>
        )}
      </ProfileSectionLayout>
    </div>
  );
}
