/* Bouton Cast — onglet "Sync TV" (PeerJS QR code) + onglet "Hors-ligne" */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Cast, Tv, X, Copy, Check, Wifi, WifiOff, Bookmark, BookmarkCheck } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LocalServerState } from '@/hooks/useLocalServer';

const SAVED_OFFLINE_URL_KEY = 'biblecast:saved-offline-url';

interface CastButtonProps {
  roomCode: string;
  displayUrl: string;
  connectedCount: number;
  isReady: boolean;
  localServer?: LocalServerState;
}

export default function CastButton({
  roomCode, displayUrl, connectedCount, isReady, localServer,
}: CastButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'peer' | 'offline'>('peer');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOffline, setCopiedOffline] = useState(false);
  const [copiedOfflineFull, setCopiedOfflineFull] = useState(false);
  const [savedOfflineUrl, setSavedOfflineUrl] = useState<string | null>(() => {
    try { return localStorage.getItem(SAVED_OFFLINE_URL_KEY); } catch { return null; }
  });
  const [urlSaved, setUrlSaved] = useState(false);

  const isPeerConnected = connectedCount > 0;

  const offlineUrl = localServer?.httpUrl
    ? `${localServer.httpUrl}/display?local=1`
    : null;

  const offlineUrlFull = localServer?.httpUrl && localServer?.wsEncodedUrl
    ? `${localServer.httpUrl}/display?ws=${localServer.wsEncodedUrl}`
    : null;

  const displayedOfflineUrl = offlineUrl ?? savedOfflineUrl;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch { }
  };

  const handleCopyOfflineUrl = async () => {
    if (!displayedOfflineUrl) return;
    try {
      await navigator.clipboard.writeText(displayedOfflineUrl);
      setCopiedOffline(true);
      setTimeout(() => setCopiedOffline(false), 2000);
    } catch { }
  };

  const handleCopyOfflineFullUrl = async () => {
    if (!offlineUrlFull) return;
    try {
      await navigator.clipboard.writeText(offlineUrlFull);
      setCopiedOfflineFull(true);
      setTimeout(() => setCopiedOfflineFull(false), 2000);
    } catch { }
  };

  const handleSaveOfflineUrl = async () => {
    if (!offlineUrl) return;
    try {
      localStorage.setItem(SAVED_OFFLINE_URL_KEY, offlineUrl);
      setSavedOfflineUrl(offlineUrl);
      await navigator.clipboard.writeText(offlineUrl);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 3000);
    } catch { }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowModal(true)}
        title={isPeerConnected ? `${connectedCount} écran(s) TV connecté(s)` : 'Diffuser sur TV'}
        className={cn(
          'gap-1.5 transition-smooth',
          isPeerConnected ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isPeerConnected ? <Tv className="h-4 w-4" /> : <Cast className="h-4 w-4" />}
        <span className="hidden sm:inline text-xs">
          {isPeerConnected ? `${connectedCount} TV` : 'Cast'}
        </span>
        {isPeerConnected && (
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
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

                {(localServer?.isNative) && (
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
                      Sync TV (Internet)
                      {isPeerConnected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('offline')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                        activeTab === 'offline'
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <WifiOff className="h-3.5 w-3.5" />
                      Hors-ligne (WiFi local)
                      {localServer.isServerRunning && (
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 pb-4 space-y-4">

                {/* Onglet Sync TV — PeerJS */}
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
                          Connexion…
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Code de la salle (permanent)</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary/60 border border-border/40 rounded-lg px-3 py-2 font-mono text-lg font-bold tracking-[0.3em] text-foreground text-center">
                            {roomCode}
                          </div>
                          <button
                            onClick={handleCopyCode}
                            className="h-9 w-9 rounded-lg border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth shrink-0"
                            title="Copier le code"
                          >
                            {copiedCode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">URL complète</p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-[10px] text-muted-foreground/60 break-all font-mono bg-secondary/40 rounded-lg px-3 py-2">
                            {displayUrl}
                          </p>
                          <button
                            onClick={handleCopyUrl}
                            className="h-9 w-9 rounded-lg border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth shrink-0"
                            title="Copier l'URL"
                          >
                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">Comment connecter la TV</p>
                      {[
                        'Sur la TV, ouvrez Chrome ou Firefox',
                        'Scannez le QR code OU entrez le code de salle',
                        'La TV et la tablette peuvent être sur des réseaux différents',
                        'Le code de salle est permanent — ne change pas',
                      ].map((step, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Onglet Hors-ligne (APK natif uniquement) */}
                {activeTab === 'offline' && localServer && (
                  <div className="space-y-4">
                    {localServer.isServerRunning ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                        Serveur local actif — {localServer.localIP}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                        <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
                        Démarrage du serveur local…
                      </div>
                    )}

                    {displayedOfflineUrl && (
                      <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                        <QRCode
                          value={displayedOfflineUrl}
                          size={200}
                          level="M"
                          style={{ height: 'auto', maxWidth: '200px', width: '100%' }}
                        />
                      </div>
                    )}

                    {displayedOfflineUrl && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">Adresse courte <span className="text-primary/70">(recommandée)</span></p>
                          <div className="flex items-center gap-2">
                            <p className="flex-1 text-[10px] text-foreground break-all font-mono bg-secondary/60 border border-border/40 rounded-lg px-3 py-2">
                              {displayedOfflineUrl}
                            </p>
                            <button
                              onClick={handleCopyOfflineUrl}
                              className="h-9 w-9 rounded-lg border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth shrink-0"
                              title="Copier l'adresse courte"
                            >
                              {copiedOffline ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {offlineUrlFull && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium">Adresse complète <span className="text-muted-foreground/60">(format original)</span></p>
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-[10px] text-muted-foreground/70 break-all font-mono bg-secondary/40 rounded-lg px-3 py-2">
                                {offlineUrlFull}
                              </p>
                              <button
                                onClick={handleCopyOfflineFullUrl}
                                className="h-9 w-9 rounded-lg border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth shrink-0"
                                title="Copier l'adresse complète"
                              >
                                {copiedOfflineFull ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {offlineUrl && (
                          <button
                            onClick={handleSaveOfflineUrl}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all',
                              urlSaved
                                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                            )}
                          >
                            {urlSaved
                              ? <><BookmarkCheck className="h-4 w-4" /> Adresse mémorisée et copiée !</>
                              : <><Bookmark className="h-4 w-4" /> Mémoriser cette adresse</>
                            }
                          </button>
                        )}

                        {savedOfflineUrl && !offlineUrl && (
                          <p className="text-[10px] text-amber-400/80 text-center px-2">
                            Adresse mémorisée du dernier lancement — serveur en cours de démarrage…
                          </p>
                        )}
                      </div>
                    )}

                    <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">Projeter sans Internet</p>
                      {[
                        'Connectez la tablette ET la TV au même réseau WiFi (box ou routeur)',
                        'Les deux appareils doivent être sur le même réseau — sans internet requis',
                        'Sur la TV, ouvrez Chrome et scannez le QR code ou tapez l\'adresse',
                        'Mémorisez l\'adresse sur la TV (Favoris) — stable sur le même réseau WiFi',
                      ].map((step, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-border/40">
                <Button className="w-full btn-gold" onClick={() => setShowModal(false)}>Fermer</Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
