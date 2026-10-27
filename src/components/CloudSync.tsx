import { useState } from 'react';
import { useStore } from '../lib/store';
import { friendlyError, sendLoginCode, verifyLoginCode } from '../lib/sync';

/** Login por código no e-mail e status da sincronização entre aparelhos. */
export function CloudSync() {
  const { cloud, syncNow, cloudSignOut } = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!cloud.configured) {
    return (
      <p className="small muted">
        Esta versão do app não está ligada a um servidor, então o progresso fica só neste aparelho. Use o backup abaixo para levar para
        outro aparelho.
      </p>
    );
  }

  if (cloud.email) {
    const time = cloud.lastSync ? new Date(cloud.lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
    return (
      <div className="cloud">
        <p className="cloud-account">
          <span className={`cloud-dot ${cloud.status}`} aria-hidden />
          Conectado como <strong>{cloud.email}</strong>
        </p>
        <p className="small muted" role="status">
          {cloud.status === 'syncing'
            ? 'Sincronizando…'
            : cloud.status === 'error'
              ? cloud.error
              : time
                ? `Sincronizado às ${time}. Abra o Frangão com esta conta em outro aparelho e o progresso aparece lá.`
                : 'Conectado.'}
        </p>
        <div className="btn-row">
          <button className="btn btn-soft" disabled={cloud.status === 'syncing'} onClick={() => void syncNow()}>
            🔄 Sincronizar agora
          </button>
          <button className="btn btn-ghost" onClick={() => void cloudSignOut()}>
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <form
      className="cloud"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 'email') {
          if (validEmail) void run(async () => {
            await sendLoginCode(email.trim());
            setStep('code');
          });
        } else if (code.trim().length >= 6) {
          void run(() => verifyLoginCode(email.trim(), code.trim()));
        }
      }}
    >
      {step === 'email' ? (
        <>
          <p className="small muted">Entre com seu e-mail para salvar o progresso na nuvem e continuar de qualquer aparelho. Não precisa de senha.</p>
          <label className="field">
            <span>E-mail</span>
            <input
              id="cloud-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={!validEmail || busy}>
            {busy ? 'Enviando…' : 'Enviar código'}
          </button>
        </>
      ) : (
        <>
          <p className="small">
            Enviamos um código para <strong>{email}</strong>. Digite o código abaixo ou toque no link do e-mail neste aparelho.
          </p>
          <label className="field">
            <span>Código</span>
            <input
              id="cloud-code"
              className="input input-lg code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={code.length < 6 || busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="btn-row">
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => void run(() => sendLoginCode(email.trim()))}>
              Reenviar código
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
            >
              Trocar e-mail
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="small warn" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
