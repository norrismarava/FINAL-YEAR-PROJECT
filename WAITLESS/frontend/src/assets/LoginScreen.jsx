import { useState, useRef } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquareText,
  PenLine,
  Search,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "./BrandMark";
import { GatewayOperator } from "./GatewayOperator";
import { NeuralCanvas } from "./NeuralCanvas";
import { ThemeButton } from "./ThemeButton";
import { Banner } from "./ui/Banner";
import { Field } from "./ui/Field";

export function LoginScreen({
  advancedGatewayKey,
  setAdvancedGatewayKey,
  loginWithPassword,
  loginWithGatewayKey,
  loading,
  error,
  theme,
  toggleTheme,
}) {
  const [mode, setMode] = useState("password");
  const [showSecret, setShowSecret] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const shellRef = useRef(null);

  function trackScenePointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - rect.left) / rect.width - .5;
    const vertical = (event.clientY - rect.top) / rect.height - .5;
    shellRef.current?.style.setProperty("--scene-shift-x", `${(horizontal * 9).toFixed(2)}px`);
    shellRef.current?.style.setProperty("--scene-shift-y", `${(vertical * 7).toFixed(2)}px`);
    shellRef.current?.style.setProperty("--scene-shift-x-reverse", `${(-horizontal * 6).toFixed(2)}px`);
    shellRef.current?.style.setProperty("--scene-shift-y-reverse", `${(-vertical * 5).toFixed(2)}px`);
  }

  function resetScenePointer() {
    ["--scene-shift-x", "--scene-shift-y", "--scene-shift-x-reverse", "--scene-shift-y-reverse"]
      .forEach((property) => shellRef.current?.style.setProperty(property, "0px"));
  }

  return (
    <main ref={shellRef} className="login-shell" onPointerMove={trackScenePointer} onPointerLeave={resetScenePointer}>
      <NeuralCanvas className="login-network" theme={theme} density={92} />
      <ThemeButton theme={theme} toggleTheme={toggleTheme} className="login-theme-toggle" />
      <div className="login-frame">
        <section className="login-form-panel">
          <div className="login-form-wrap">
            <div className="login-brand-lockup form-brand">
              <BrandMark compact />
              <div>
                <p className="eyebrow">Fiscal Support Services</p>
                <p className="brand-product">Private Fiscal Gateway</p>
              </div>
            </div>
            <div className="login-heading">
              <span className="login-kicker"><ShieldCheck size={15} /> Protected administration</span>
              <h1>Welcome back</h1>
              <p>Sign in to manage secure fiscal routing, connected devices and document processing.</p>
            </div>

            <div className="segmented-control" role="tablist" aria-label="Authentication method">
              <button type="button" className={mode === "password" ? "active" : ""} onClick={() => setMode("password")}>
                <CircleUserRound size={16} /> Admin account
              </button>
              <button type="button" className={mode === "key" ? "active" : ""} onClick={() => setMode("key")}>
                <KeyRound size={16} /> Gateway key
              </button>
            </div>

            {mode === "password" ? (
              <form className="form-stack" onSubmit={(event) => { event.preventDefault(); loginWithPassword(credentials); }}>
                <Field label="Username" hint="Administrator account">
                  <div className="input-with-icon">
                    <CircleUserRound size={18} />
                    <input
                      value={credentials.username}
                      onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
                      placeholder="Enter username"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </Field>
                <Field label="Password" hint="Case-sensitive">
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                      type={showSecret ? "text" : "password"}
                      value={credentials.password}
                      onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button type="button" className="input-action" onClick={() => setShowSecret((value) => !value)} title={showSecret ? "Hide password" : "Show password"}>
                      {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                {error && <Banner tone="error" message={error} />}
                <button className="button primary login-submit" disabled={loading || !credentials.username || !credentials.password}>
                  {loading ? <Loader2 className="spin" size={18} /> : <Lock size={18} />}
                  Sign in securely
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <form className="form-stack" onSubmit={(event) => { event.preventDefault(); loginWithGatewayKey(advancedGatewayKey); }}>
                <Field label="Gateway administrator key" hint="Controlled recovery access">
                  <div className="input-with-icon">
                    <KeyRound size={18} />
                    <input
                      type={showSecret ? "text" : "password"}
                      value={advancedGatewayKey}
                      onChange={(event) => setAdvancedGatewayKey(event.target.value)}
                      placeholder="Paste gateway administrator key"
                    />
                    <button type="button" className="input-action" onClick={() => setShowSecret((value) => !value)} title={showSecret ? "Hide key" : "Show key"}>
                      {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                {error && <Banner tone="error" message={error} />}
                <button className="button primary login-submit" disabled={loading || !advancedGatewayKey}>
                  {loading ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
                  Verify gateway key
                  {!loading && <ArrowRight size={18} />}
                </button>
                <div className="inline-note"><ShieldCheck size={18} /><p>Use normal administrator login for routine work. Gateway keys are reserved for controlled recovery or API access.</p></div>
              </form>
            )}

            <div className="login-footer">
              <span><Lock size={14} /> Encrypted session</span>
              <a href="/django-admin/">Django administration <ChevronRight size={14} /></a>
            </div>
          </div>
        </section>

        <section className="login-brand-panel" aria-label="Private Fiscal Gateway introduction">
          <div className="login-statement art-status">
            <span className="status-dot" />
            <p>Gateway network ready</p>
          </div>
          <div className="gateway-visual-stage" aria-hidden="true">
            <div className="gateway-operator-scene">
              <span className="scene-orbit scene-orbit-outer" />
              <span className="scene-orbit scene-orbit-inner" />
              <span className="scene-vector scene-message"><MessageSquareText /></span>
              <span className="scene-vector scene-envelope"><Mail /></span>
              <span className="scene-vector scene-magnifier"><Search /></span>
              <GatewayOperator />
              <span className="scene-gateway-link" aria-hidden="true">
                <span className="gateway-link-lane gateway-link-request"><i /><b /></span>
                <span className="gateway-link-lane gateway-link-response"><i /><b /></span>
                <span className="gateway-link-handshake"><ShieldCheck /></span>
              </span>
              <span className="scene-gateway-lock" aria-label="Private Fiscal Gateway secure exchange">
                <span className="scene-lock-orbit scene-lock-orbit-outer"><i /><b /></span>
                <span className="scene-lock-orbit scene-lock-orbit-inner"><i /><b /></span>
                <span className="scene-lock-status"><span /> SECURE</span>
                <span className="scene-lock-core">
                  <span className="scene-lock-shackle"><i /></span>
                  <span className="scene-lock-body">
                    <ShieldCheck />
                    <i className="scene-lock-keyhole" />
                  </span>
                </span>
                <span className="scene-lock-response"><CheckCircle2 /> VERIFIED</span>
                <span className="scene-lock-port scene-lock-port-in" />
                <span className="scene-lock-port scene-lock-port-out" />
              </span>
              <span className="scene-vector scene-validation"><CheckCircle2 /></span>
              <span className="scene-vector scene-pencil"><PenLine /></span>
              <span className="scene-data-packet scene-data-packet-one" />
              <span className="scene-data-packet scene-data-packet-two" />
            </div>
            <div className="visual-signal visual-signal-odoo">
              <span><Building2 size={15} /></span>
              <p><strong>Odoo.sh</strong><small>Document submitted</small></p>
            </div>
            <div className="visual-signal visual-signal-policy">
              <span><ShieldCheck size={15} /></span>
              <p><strong>Policy verified</strong><small>Credential boundary active</small></p>
            </div>
            <div className="visual-signal visual-signal-receipt">
              <span><FileText size={15} /></span>
              <p><strong>Fiscal receipt</strong><small>Response route secured</small></p>
            </div>
            <span className="visual-node node-one" />
            <span className="visual-node node-two" />
            <span className="visual-node node-three" />
          </div>
          <div className="gateway-route" aria-label="Gateway connection path">
            <span><Building2 size={16} /> Odoo.sh</span>
            <i><span /></i>
            <span className="route-gateway"><ShieldCheck size={16} /> Private gateway</span>
            <i><span /></i>
            <span><Globe2 size={16} /> Fiscal Suite</span>
          </div>
        </section>
      </div>
    </main>
  );
}
