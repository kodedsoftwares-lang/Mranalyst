import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  useAdminGetTips, useAdminCreateTip, useAdminUpdateTip, useAdminDeleteTip,
  useAdminGetUsers, useAdminUpdateUser,
  useAdminGetConfig, useAdminUpdateConfig,
  useAdminGetScheduledPosts, useAdminCreateScheduledPost, useAdminDeleteScheduledPost,
  getAdminGetTipsQueryKey, getAdminGetUsersQueryKey, getAdminGetConfigQueryKey, getAdminGetScheduledPostsQueryKey,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import type { TipInput, TipUpdate } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Pencil, Plus, LogOut, Copy, Key, UserPlus, ShieldCheck, Eye, EyeOff } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("mr_analyst_admin_token") ?? "";
  return fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

// ─── Admin Login ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({ title: (err as any).error ?? "Invalid email or password", variant: "destructive" });
        return;
      }
      const data = await resp.json();
      onLogin(data.token);
    } catch {
      toast({ title: "Login failed — check your connection", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px", background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "24px" }} data-testid="card-admin-login">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <ShieldCheck size={22} color="#a8ff4d" />
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "16px" }}>Admin Login</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ fontSize: "11px", color: "#888" }}>Admin Email</FormLabel>
                <FormControl><Input type="email" data-testid="input-admin-email" placeholder="admin@mranalyst.org" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ fontSize: "11px", color: "#888" }}>Password</FormLabel>
                <FormControl>
                  <div style={{ position: "relative" }}>
                    <Input type={showPw ? "text" : "password"} data-testid="input-admin-password" {...field} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={loading} data-testid="button-admin-login" style={{ background: "#a8ff4d", color: "#000", fontWeight: 800 }}>
              {loading ? "Verifying…" : "Login"}
            </Button>
          </form>
        </Form>

        <p style={{ marginTop: "16px", fontSize: "11px", color: "#555", textAlign: "center" }}>
          Default: use the admin email + password configured in your environment
        </p>
      </div>
    </div>
  );
}

// ─── Tips Tab ─────────────────────────────────────────────────────────────────

const tipFormSchema = z.object({
  tier: z.enum(["pro_plus", "pro"]),
  teams: z.string().optional(),
  tip_type: z.string().optional(),
  odds: z.string().optional(),
  status: z.enum(["locked", "pending", "won", "lost", "postponed", "cancelled"]),
  match_date: z.string().optional(),
  match_time: z.string().optional(),
});
type TipFormValues = z.infer<typeof tipFormSchema>;

function TipsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: tips, isLoading } = useAdminGetTips({}, { query: { queryKey: getAdminGetTipsQueryKey({}) } });
  const { mutate: createTip, isPending: creating } = useAdminCreateTip();
  const { mutate: updateTip, isPending: updating } = useAdminUpdateTip();
  const { mutate: deleteTip } = useAdminDeleteTip();

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipFormSchema),
    defaultValues: { tier: "pro_plus", status: "pending", teams: "", tip_type: "", odds: "", match_date: "", match_time: "" },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminGetTipsQueryKey({}) });

  const handleEdit = (tip: any) => {
    setEditingId(tip.id);
    setShowForm(true);
    form.reset({ tier: tip.tier, status: tip.status, teams: tip.teams ?? "", tip_type: tip.tip_type ?? "", odds: tip.odds?.toString() ?? "", match_date: tip.match_date ?? "", match_time: tip.match_time ?? "" });
  };

  const handleSubmit = (values: TipFormValues) => {
    const payload: TipInput & TipUpdate = { tier: values.tier, status: values.status, teams: values.teams || undefined, tip_type: values.tip_type || undefined, odds: values.odds ? parseFloat(values.odds) : undefined, match_date: values.match_date || undefined, match_time: values.match_time || undefined };
    if (editingId) {
      updateTip({ id: editingId, data: payload }, { onSuccess: () => { toast({ title: "Tip updated" }); invalidate(); setShowForm(false); setEditingId(null); form.reset(); }, onError: () => toast({ title: "Failed to update tip", variant: "destructive" }) });
    } else {
      createTip({ data: payload }, { onSuccess: () => { toast({ title: "Tip created" }); invalidate(); setShowForm(false); form.reset(); }, onError: () => toast({ title: "Failed to create tip", variant: "destructive" }) });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: "#fff" }}>Tips</span>
        <Button size="sm" data-testid="button-add-tip" onClick={() => { setShowForm(!showForm); setEditingId(null); form.reset(); }} style={{ background: "#a8ff4d", color: "#000" }}>
          <Plus size={14} style={{ marginRight: "4px" }} /> Add Tip
        </Button>
      </div>
      {showForm && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px" }} data-testid="form-tip">
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "13px", marginBottom: "12px" }}>{editingId ? "Edit Tip" : "New Tip"}</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField control={form.control} name="tier" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-tier"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="pro_plus">Pro Plus</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="locked">Locked</SelectItem><SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="won">Won</SelectItem><SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="postponed">Postponed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="teams" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Teams</FormLabel><FormControl><Input placeholder="Team A vs Team B" data-testid="input-teams" {...field} /></FormControl></FormItem>
              )} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField control={form.control} name="tip_type" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Tip Type</FormLabel><FormControl><Input placeholder="Over 2.5…" data-testid="input-tip-type" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="odds" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Odds</FormLabel><FormControl><Input type="number" step="0.01" placeholder="1.85" data-testid="input-odds" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField control={form.control} name="match_date" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Date</FormLabel><FormControl><Input type="date" data-testid="input-match-date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="match_time" render={({ field }) => (
                  <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Time</FormLabel><FormControl><Input type="time" data-testid="input-match-time" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="submit" disabled={creating || updating} data-testid="button-save-tip" style={{ flex: 1, background: "#a8ff4d", color: "#000" }}>Save</Button>
                <Button type="button" variant="outline" data-testid="button-cancel-tip" onClick={() => { setShowForm(false); setEditingId(null); form.reset(); }}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{[1,2,3].map(i => <div key={i} style={{ height: "48px", borderRadius: "10px", background: "#111" }} />)}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(tips || []).map((tip) => (
            <div key={tip.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "10px 12px" }} data-testid={`admin-tip-row-${tip.id}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tip.teams ?? "Locked tip"}</p>
                <p style={{ fontSize: "10px", color: "#666" }}>{tip.tier} · {tip.status} {tip.match_date ? `· ${tip.match_date}` : ""}</p>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <Button size="icon" variant="ghost" style={{ width: "28px", height: "28px" }} data-testid={`button-edit-tip-${tip.id}`} onClick={() => handleEdit(tip)}><Pencil size={13} /></Button>
                <Button size="icon" variant="ghost" style={{ width: "28px", height: "28px", color: "#ef4444" }} data-testid={`button-delete-tip-${tip.id}`}
                  onClick={() => deleteTip({ id: tip.id }, { onSuccess: () => { toast({ title: "Tip deleted" }); invalidate(); }, onError: () => toast({ title: "Failed", variant: "destructive" }) })}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Access Codes Tab ─────────────────────────────────────────────────────────

const codeSchema = z.object({
  tier: z.enum(["pro_plus", "pro"]),
  label: z.string().optional(),
  expires_at: z.string().optional(),
});
type CodeValues = z.infer<typeof codeSchema>;

function AccessCodesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: codes, isLoading, refetch } = useQuery({
    queryKey: ["admin-access-codes"],
    queryFn: () => adminFetch("/admin/access-codes").then(r => r.json()),
  });

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: (data: CodeValues) => adminFetch("/admin/access-codes", { method: "POST", body: JSON.stringify({ ...data, expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null }) }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Code generated!" }); refetch(); setShowForm(false); codeForm.reset(); },
    onError: () => toast({ title: "Failed to generate code", variant: "destructive" }),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminFetch(`/admin/access-codes/${id}`, { method: "PATCH", body: JSON.stringify({ is_active }) }).then(r => r.json()),
    onSuccess: () => refetch(),
  });

  const { mutate: deleteCode } = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/access-codes/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Code deleted" }); refetch(); },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { tier: "pro_plus", label: "", expires_at: "" },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast({ title: "Code copied!" }));
  };

  const codeList = Array.isArray(codes) ? codes : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: "#fff" }}>Access Codes ({codeList.length})</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} style={{ background: "#a8ff4d", color: "#000" }}>
          <Key size={14} style={{ marginRight: "4px" }} /> Generate Code
        </Button>
      </div>

      <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: "10px", padding: "10px 12px", fontSize: "11px", color: "#88cc88" }}>
        ⚠️ Each code can only be used by <strong>one email address</strong>. Once registered, it cannot be used by anyone else. Codes can expire automatically.
      </div>

      {showForm && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "13px", marginBottom: "12px" }}>Generate New Access Code</p>
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit((v) => generate(v))} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <FormField control={codeForm.control} name="tier" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="pro_plus">Pro Plus VIP</SelectItem><SelectItem value="pro">Pro VIP</SelectItem></SelectContent>
                  </Select></FormItem>
              )} />
              <FormField control={codeForm.control} name="label" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Label / User Note (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. John Doe — referral" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={codeForm.control} name="expires_at" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Expires At (optional)</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <p style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>Leave blank = never expires</p>
                </FormItem>
              )} />
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="submit" disabled={generating} style={{ flex: 1, background: "#a8ff4d", color: "#000" }}>{generating ? "Generating…" : "Generate"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{[1,2,3].map(i => <div key={i} style={{ height: "64px", borderRadius: "10px", background: "#111" }} />)}</div>
      ) : codeList.length === 0 ? (
        <p style={{ textAlign: "center", color: "#555", fontSize: "13px", padding: "20px 0" }}>No codes yet. Generate your first one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {codeList.map((c: any) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const isUsed = !!c.used_by_email;
            return (
              <div key={c.id} style={{ background: "#111", border: `1px solid ${expired ? "#3a1a1a" : isUsed ? "#1a2a1a" : "#1e2e1e"}`, borderRadius: "10px", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "#a8ff4d", letterSpacing: "0.05em" }}>{c.code}</span>
                      <button onClick={() => copyCode(c.code)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: "2px" }}><Copy size={13} /></button>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "20px", background: c.tier === "pro_plus" ? "#3a2a00" : "#0a2a0a", color: c.tier === "pro_plus" ? "#f5d700" : "#22c55e", fontWeight: 700 }}>
                        {c.tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP"}
                      </span>
                      {c.is_active && !expired ? (
                        <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "20px", background: "#0a200a", color: "#a8ff4d", fontWeight: 700 }}>Active</span>
                      ) : expired ? (
                        <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "20px", background: "#2a0a0a", color: "#f87171", fontWeight: 700 }}>Expired</span>
                      ) : (
                        <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "20px", background: "#1a1a1a", color: "#666", fontWeight: 700 }}>Disabled</span>
                      )}
                      {isUsed && <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "20px", background: "#1a1a2a", color: "#93c5fd", fontWeight: 700 }}>Used</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button size="sm" variant="outline" style={{ fontSize: "10px", height: "26px", padding: "0 8px" }} onClick={() => deactivate({ id: c.id, is_active: !c.is_active })}>
                      {c.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button size="icon" variant="ghost" style={{ width: "26px", height: "26px", color: "#ef4444" }} onClick={() => deleteCode(c.id)}><Trash2 size={12} /></Button>
                  </div>
                </div>
                {c.label && <p style={{ fontSize: "11px", color: "#888", marginBottom: "3px" }}>Note: {c.label}</p>}
                {isUsed && <p style={{ fontSize: "10px", color: "#93c5fd" }}>Used by: {c.used_by_email}</p>}
                {c.expires_at && <p style={{ fontSize: "10px", color: expired ? "#f87171" : "#666" }}>Expires: {new Date(c.expires_at).toLocaleString()}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admins Tab ───────────────────────────────────────────────────────────────

const newAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Min 6 characters"),
});
type NewAdminValues = z.infer<typeof newAdminSchema>;

function AdminsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { data: admins, isLoading, refetch } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => adminFetch("/admin/auth/admins").then(r => r.json()),
  });

  const { mutate: addAdmin, isPending } = useMutation({
    mutationFn: (data: NewAdminValues) => adminFetch("/admin/auth/admins", { method: "POST", body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (data) => {
      if ((data as any).error) { toast({ title: (data as any).error, variant: "destructive" }); return; }
      toast({ title: "Admin added!" }); refetch(); setShowForm(false); adminForm.reset();
    },
    onError: () => toast({ title: "Failed to add admin", variant: "destructive" }),
  });

  const { mutate: removeAdmin } = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/auth/admins/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Admin removed" }); refetch(); },
  });

  const adminForm = useForm<NewAdminValues>({
    resolver: zodResolver(newAdminSchema),
    defaultValues: { email: "", password: "" },
  });

  const adminList = Array.isArray(admins) ? admins : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: "#fff" }}>Administrators ({adminList.length})</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} style={{ background: "#a8ff4d", color: "#000" }}>
          <UserPlus size={14} style={{ marginRight: "4px" }} /> Add Admin
        </Button>
      </div>

      {showForm && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "13px", marginBottom: "12px" }}>Add Administrator</p>
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit((v) => addAdmin(v))} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <FormField control={adminForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={adminForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Password (min 6 chars)</FormLabel>
                  <FormControl>
                    <div style={{ position: "relative" }}>
                      <Input type={showPw ? "text" : "password"} placeholder="Password" {...field} />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="submit" disabled={isPending} style={{ flex: 1, background: "#a8ff4d", color: "#000" }}>{isPending ? "Adding…" : "Add Admin"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{[1,2].map(i => <div key={i} style={{ height: "52px", borderRadius: "10px", background: "#111" }} />)}</div>
      ) : adminList.length === 0 ? (
        <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "#88cc88" }}>
          No additional admins in database. The master admin is configured via environment variables (ADMIN_EMAIL + ADMIN_SECRET).
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {adminList.map((a: any) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "10px 12px" }}>
              <ShieldCheck size={16} color="#a8ff4d" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{a.email}</p>
                <p style={{ fontSize: "10px", color: "#555" }}>Added {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <Button size="icon" variant="ghost" style={{ width: "28px", height: "28px", color: "#ef4444" }} onClick={() => removeAdmin(a.id)}><Trash2 size={13} /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useAdminGetUsers({ query: { queryKey: getAdminGetUsersQueryKey() } });
  const { mutate: updateUser } = useAdminUpdateUser();

  const toggleAdmin = (id: string, isAdmin: boolean) =>
    updateUser({ id, data: { is_admin: !isAdmin } }, { onSuccess: () => { toast({ title: "User updated" }); queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={{ fontWeight: 700, color: "#fff" }}>VIP Users ({(users || []).length})</span>
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{[1,2,3].map(i => <div key={i} style={{ height: "60px", borderRadius: "10px", background: "#111" }} />)}</div>
      ) : (users || []).length === 0 ? (
        <p style={{ color: "#555", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No users yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(users || []).map((user) => (
            <div key={user.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "10px 12px" }} data-testid={`admin-user-row-${user.id}`}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                  <div style={{ display: "flex", gap: "6px", marginTop: "3px" }}>
                    {user.subscription && <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", color: user.subscription === "pro_plus" ? "#f59e0b" : "#22c55e", background: user.subscription === "pro_plus" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)" }}>{user.subscription === "pro_plus" ? "PRO+" : "PRO"}</span>}
                    <span style={{ fontSize: "9px", color: "#555" }}>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" style={{ fontSize: "10px", height: "24px", padding: "0 8px", flexShrink: 0 }} data-testid={`button-toggle-admin-${user.id}`} onClick={() => toggleAdmin(user.id, user.is_admin)}>
                  {user.is_admin ? "Remove Admin" : "Make Admin"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

const CONFIG_LABELS: Record<string, string> = {
  support_email: "📧 Support Email",
  whatsapp_link: "💬 WhatsApp Link",
  telegram_link: "✈️ Telegram Link",
  chat_type: "🔗 Chat Button Type (whatsapp / telegram)",
  payment_link_pro_plus: "💳 Payment Link — Pro Plus VIP",
  payment_link_pro: "💳 Payment Link — Pro VIP",
  pro_plus_price: "💰 Pro Plus VIP Price",
  pro_price: "💰 Pro VIP Price",
};

function ConfigTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useAdminGetConfig({ query: { queryKey: getAdminGetConfigQueryKey() } });
  const { mutate: updateConfig } = useAdminUpdateConfig();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleUpdate = (key: string, value: string) =>
    updateConfig({ data: { key, value } }, { onSuccess: () => { toast({ title: "Saved!" }); queryClient.invalidateQueries({ queryKey: getAdminGetConfigQueryKey() }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });

  if (isLoading) return <div style={{ height: "200px", borderRadius: "12px", background: "#111" }} />;

  const priorityKeys = Object.keys(CONFIG_LABELS);
  const allKeys = (config || []).map((c) => c.key);
  const ordered = [...priorityKeys.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !priorityKeys.includes(k))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span style={{ fontWeight: 700, color: "#fff" }}>App Settings</span>
      {ordered.map((key) => {
        const item = (config || []).find(c => c.key === key);
        if (!item) return null;
        return (
          <div key={key} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "12px" }} data-testid={`config-item-${key}`}>
            <p style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>{CONFIG_LABELS[key] ?? key}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                defaultValue={item.value}
                style={{ fontSize: "12px" }}
                data-testid={`input-config-${key}`}
                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
              />
              <Button size="sm" style={{ background: "#a8ff4d", color: "#000", flexShrink: 0 }} data-testid={`button-update-config-${key}`}
                onClick={() => handleUpdate(key, editValues[key] ?? item.value)}>
                Save
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Scheduled Tab ────────────────────────────────────────────────────────────

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tier: z.enum(["pro_plus", "pro"]),
  publish_at: z.string().min(1),
});
type PostValues = z.infer<typeof postSchema>;

function ScheduledTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data: posts, isLoading } = useAdminGetScheduledPosts({ query: { queryKey: getAdminGetScheduledPostsQueryKey() } });
  const { mutate: createPost, isPending } = useAdminCreateScheduledPost();
  const { mutate: deletePost } = useAdminDeleteScheduledPost();
  const form = useForm<PostValues>({ resolver: zodResolver(postSchema), defaultValues: { title: "", content: "", tier: "pro_plus", publish_at: "" } });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminGetScheduledPostsQueryKey() });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: "#fff" }}>Scheduled Posts</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} style={{ background: "#a8ff4d", color: "#000" }}><Plus size={14} style={{ marginRight: "4px" }} />Schedule</Button>
      </div>
      {showForm && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px" }} data-testid="form-scheduled-post">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => createPost({ data: { ...v, publish_at: new Date(v.publish_at).toISOString() } }, { onSuccess: () => { toast({ title: "Post scheduled" }); invalidate(); setShowForm(false); form.reset(); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }))} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Title</FormLabel><FormControl><Input data-testid="input-post-title" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Content</FormLabel><FormControl><Textarea data-testid="input-post-content" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField control={form.control} name="tier" render={({ field }) => (<FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Tier</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-post-tier"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pro_plus">Pro Plus</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="publish_at" render={({ field }) => (<FormItem><FormLabel style={{ fontSize: "11px", color: "#888" }}>Publish At</FormLabel><FormControl><Input type="datetime-local" data-testid="input-publish-at" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="submit" disabled={isPending} style={{ flex: 1, background: "#a8ff4d", color: "#000" }}>Schedule</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}
      {isLoading ? <div style={{ height: "80px", borderRadius: "12px", background: "#111" }} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(posts || []).map((post) => (
            <div key={post.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "10px 12px" }} data-testid={`admin-post-row-${post.id}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{post.title}</p>
                  <p style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>{post.tier} · {post.status} · {new Date(post.publish_at).toLocaleString()}</p>
                </div>
                <Button size="icon" variant="ghost" style={{ width: "28px", height: "28px", color: "#ef4444" }} data-testid={`button-delete-post-${post.id}`}
                  onClick={() => deletePost({ id: post.id }, { onSuccess: () => { toast({ title: "Post deleted" }); invalidate(); }, onError: () => toast({ title: "Failed", variant: "destructive" }) })}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

const TABS = ["Tips", "Codes", "Admins", "Users", "Config", "Scheduled"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const { adminToken, setAdminToken, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Tips");
  const { toast } = useToast();

  // Wire up auth token getter for API client
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("mr_analyst_admin_token") ?? "");
  }, []);

  const handleLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem("mr_analyst_admin_token", token);
    toast({ title: "Welcome to Admin Panel!" });
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("mr_analyst_admin_token");
  };

  if (!adminToken) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div style={{ paddingBottom: "20px", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}><ArrowLeft size={18} /></button>
          </Link>
          <span style={{ fontWeight: 800, color: "#fff", fontSize: "15px" }}>Admin Panel</span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleLogout} style={{ color: "#888", fontSize: "11px" }}>
          <LogOut size={13} style={{ marginRight: "4px" }} /> Logout
        </Button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "6px", padding: "12px 16px 0", overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: activeTab === tab ? "#a8ff4d" : "#1a1a1a",
              color: activeTab === tab ? "#000" : "#888",
              transition: "all 0.15s",
            }}
          >
            {tab === "Codes" ? "🔑 Codes" : tab === "Admins" ? "👤 Admins" : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {activeTab === "Tips" && <TipsTab />}
        {activeTab === "Codes" && <AccessCodesTab />}
        {activeTab === "Admins" && <AdminsTab />}
        {activeTab === "Users" && <UsersTab />}
        {activeTab === "Config" && <ConfigTab />}
        {activeTab === "Scheduled" && <ScheduledTab />}
      </div>
    </div>
  );
}
