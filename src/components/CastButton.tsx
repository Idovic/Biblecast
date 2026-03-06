/* Bouton Cast — onglet "Sync TV" (PeerJS QR code) + onglet "Chromecast" */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cast, Tv, Info, X, Copy, Check, Wifi } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    cast?: any;
    chrome?: any;
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
  }
}

type CastState = 'checking' | 'unavailable' | 'available' | 'connecting' | 'connected';

interface CastButtonProps {
  roomCode: string;
  displayUrl: string;
  connectedCount: number;
  isReady: boolean;
}

export default function CastButton({ roomCode, displayUrl, connectedCount, isReady }: CastButtonProps) {
  const [castState, setCastState] = useState<CastState>('checking');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'peer' | 'chromecast'>('peer');
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (castState === 'checking') setCastState('unavailable');
    }, 3000);

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      clearTimeout(timeout);
      if (!isAvailable || initialized.current) return;
      initialized.current = true;
      try {
        const ctx = window.cast.framework.CastContext.getInstance();
        ctx.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        ctx.addEventListener(
          window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (e: any) => {
            const map: Record<string, CastState> = {
              NO_DEVICES_AVAILABLE: 'unavailable',
              NOT_CONNECTED: 'available',
              CONNECTING: 'connecting',
              CONNECTED: 'connected',
            };
            setCastState(map[e.castState] ?? 'available');
          }
        );
        setCastState('available');
      } catch {
        setCastState('unavailable');
      }
    };

    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line

  const handleChromecastClick = () => {
    if (castState === 'connected') {
      try { window.cast.framework.CastContext.getInstance().endCurrentSession(true); } catch { }
      return;
    }
    if (castState === 'available' || castState === 'connecting') {
      try {
        window.cast.framework.CastContext.getInstance().requestSession();
      } catch { setShowModal(true); setActiveTab('chromecast'); }
      return;
    }
    setShowModal(true);
    setActiveTab('chromecast');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const isPeerConnected = connectedCount > 0;
  const isCastConnected = castState === 'connected';

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowModal(true)}
        title={isPeerConnected ? `${connectedCount} écran(s) TV connecté(s)` : 'Diffuser sur TV / Chromecast'}
        className={cn(
          'gap-1.5 transition-smooth',
          isPeerConnected ? 'text-green-400' :
          isCastConnected ? 'text-primary' :
          'text-muted-foreground hover:text-foreground'
        )}
      >
        {isPeerConnected ? <Tv className="h-4 w-4" /> : <Cast className="h-4 w-4" />}
        <span className="hidden sm:inline text-xs">
          {isPeerConnected ? `${connectedCount} TV` : isCastConnected ? 'Casting' : 'Cast'}
        </span>
        {isPeerConnected && (
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
        {isCastConnected && !isPeerConnected && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </Button>

      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-border/50 shadow-2xl animate-fade-in">
            <div className="p-6 pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Tv className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Diffuser sur TV</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Projeter l'écran sur votre téléviseur</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-smooth p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary/60 rounded-lg p-1 mt-4">
              <button
                onClick={() => setActiveTab('peer')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                  activeTab === 'peer'
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Wifi className="h-3.5 w-3.5" />
                Sync TV
                {isPeerConnected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('chromecast')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                  activeTab === 'chromecast'
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Cast className="h-3.5 w-3.5" />
                Chromecast
              </button>
            </div>
            </div>{/* fin header p-6 */}

            {/* Corps */}
            <div className="px-6 pb-4 space-y-4">

            {/* Onglet Sync TV */}
            {activeTab === 'peer' && (
              <div className="space-y-4">
                {isPeerConnected && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    {connectedCount} écran{connectedCount > 1 ? 's' : ''} TV connecté{connectedCount > 1 ? 's' : ''}
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                  {isReady ? (
                    <QRCode
                      value={displayUrl}
                      size={200}
                      level="M"
                      style={{ height: 'auto', maxWidth: '200px', width: '100%' }}
                    />
                  ) : (
                    <div className="h-[200px] w-[200px] flex items-center justify-center text-gray-400 text-xs">
                      Connexion...
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Code de la salle</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary/60 border border-border/40 rounded-lg px-3 py-2 font-mono text-sm font-bold tracking-[0.2em] text-foreground">
                      {roomCode}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="h-9 w-9 rounded-lg border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth shrink-0"
                      title="Copier l'URL"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-2 break-all font-mono">{displayUrl}</p>
                </div>

                <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">Comment connecter la TV</p>
                  {[
                    'Assurez-vous que la TV est sur le même réseau Wi-Fi',
                    'Sur la TV, ouvrez le navigateur (Chrome, Firefox…)',
                    'Scannez le QR code ou entrez l\'URL manuellement',
                    'L\'écran se connecte et reçoit les versets en temps réel',
                  ].map((step, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglet Chromecast */}
            {activeTab === 'chromecast' && (
              <div className="space-y-4">
                <div className="bg-secondary/60 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Méthode recommandée (Cast natif Chrome)</p>
                  <ol className="space-y-2.5">
                    {[
                      [<>Cliquez sur <strong className="text-foreground">"Ouvrir l'écran"</strong> en haut à droite</>, '1'],
                      [<>Dans Chrome, faites <kbd className="px-1.5 py-0.5 rounded border border-border/60 font-mono text-[10px] bg-background">Ctrl+Shift+U</kbd> ou clic droit → <strong className="text-foreground">"Caster..."</strong></>, '2'],
                      [<>Choisissez <strong className="text-foreground">"Caster l'onglet"</strong> et sélectionnez votre Chromecast</>, '3'],
                    ].map(([text, num]) => (
                      <li key={num as string} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[11px] flex items-center justify-center shrink-0 font-bold mt-0.5">{num}</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {castState !== 'unavailable' && castState !== 'checking' && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={handleChromecastClick}
                  >
                    <Cast className="h-4 w-4 mr-2" />
                    {castState === 'connected' ? 'Arrêter le cast' : 'Lancer Chromecast'}
                  </Button>
                )}

                <div className="flex items-start gap-2 text-xs text-muted-foreground/70 bg-secondary/30 rounded-lg p-3">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    L'API Cast automatique requiert Chrome, HTTPS et un Chromecast sur le même réseau Wi-Fi.
                    L'application doit aussi être enregistrée sur la Google Cast Developer Console.
                  </span>
                </div>
              </div>
            )}

            </div>{/* fin corps */}

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 border-t border-border/40">
              <Button className="w-full btn-gold" onClick={() => setShowModal(false)}>Fermer</Button>
            </div>
          </div>
          </div>{/* fin flex min-h-full */}
        </div>,
        document.body
      )}
    </>
  );
}
