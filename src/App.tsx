// ==============================
// App.tsx
// ==============================
import React, { useEffect, useState, useRef } from "react";

// 型定義
type Facility = string;
interface SavedState {
  market: Facility[];
  pool: Facility[];
  exhausted: Facility[];
}

const DEFAULT_FACILITIES: Facility[] = [
  "麦畑",
  "牧場",
  "森林",
  "鉱山",
  "リンゴ園",
  "花畑",
  "サンマ漁船",
  "マグロ漁船",
  "パン屋",
  "コンビニ",
  "チーズ工場",
  "家具工場",
  "青果市場",
  "フラワーショップ",
  "食品倉庫",
  "カフェ",
  "ファミレス",
  "寿司屋",
  "ピザ屋",
  "バーガーショップ",
  "スタジアム",
  "テレビ局",
  "ビジネスセンター",
  "出版社",
  "税務署",
  // 追加分
  "改装屋",
  "公園",
  "ブドウ園",
  "会員制BAR",
  "高級フレンチ",
  "引っ越し屋",
  "ドリンク工場",
  "雑貨屋",
  "ワイナリー",
  "ITベンチャー",
  "コーン畑",
  "貸金業",
  "清掃業",
];

const LS_KEY = "machi_koro_all_facilities_v2";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueTrimmed(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const s = raw.trim();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export default function App() {
  const [route, setRoute] = useState<string>(
    () => location.hash.replace("#", "") || "/"
  );
  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace("#", "") || "/");
    if (!location.hash) location.hash = "/";
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [allFacilities, setAllFacilities] = useState<Facility[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return uniqueTrimmed(parsed.map(String));
      }
    } catch {}
    return DEFAULT_FACILITIES;
  });

  const [selectedCount, setSelectedCount] = useState<number>(10);
  const [market, setMarket] = useState<Facility[]>([]);
  const [pool, setPool] = useState<Facility[]>([]);
  const [exhausted, setExhausted] = useState<Facility[]>([]);
  const [message, setMessage] = useState<string>("");
  const [lastAdded, setLastAdded] = useState<Facility | null>(null);
  const [mode, setMode] = useState<"random" | "manual">("random");
  const [manualSelection, setManualSelection] = useState<Facility[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);

  const historyRef = useRef<SavedState[]>([]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(allFacilities));
  }, [allFacilities]);

  const pushHistory = (state: SavedState) => {
    historyRef.current.push({
      market: state.market.slice(),
      pool: state.pool.slice(),
      exhausted: state.exhausted.slice(),
    });
  };

  const initMarket = (count: number = selectedCount) => {
    setMessage("");
    const uniq = uniqueTrimmed(allFacilities);
    if (uniq.length < count) {
      setMessage(
        `エラー：全施設 ${uniq.length} 件では選択施設数 ${count} 件を満たせません。`
      );
      return;
    }
    if (mode === "manual") {
      if (manualSelection.length !== count) {
        setMessage(
          `エラー：手動選択では ${count} 件ちょうど選んでください。現在 ${manualSelection.length} 件。`
        );
        return;
      }
      const chosen = manualSelection.slice();
      const rest = uniq.filter((x) => !chosen.includes(x));
      pushHistory({ market, pool, exhausted });
      setMarket(chosen);
      setPool(shuffle(rest));
      setExhausted([]);
      setLastAdded(null);
    } else {
      const shuffled = shuffle(uniq);
      pushHistory({ market, pool, exhausted });
      setMarket(shuffled.slice(0, count));
      setPool(shuffled.slice(count));
      setExhausted([]);
      setLastAdded(null);
    }
    setInitialized(true);
  };

  const replaceOne = (idx: number) => {
    setMessage("");
    setMarket((prevMarket) => {
      if (idx < 0 || idx >= prevMarket.length) return prevMarket;
      if (pool.length === 0) {
        setMessage("未使用プールが空です。これ以上の補充はできません。");
        return prevMarket;
      }
      pushHistory({ market: prevMarket, pool, exhausted });
      const removed = prevMarket[idx];
      const pShuffled = shuffle(pool);
      const next = pShuffled[0];
      const newPool = pShuffled.slice(1);
      const newMarket = prevMarket.slice();
      newMarket[idx] = next;
      setPool(newPool);
      setExhausted((ex) => [...ex, removed]);
      setLastAdded(next);
      return newMarket;
    });
  };

  const restorePrevious = () => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop()!;
      setMarket(prev.market);
      setPool(prev.pool);
      setExhausted(prev.exhausted);
      setLastAdded(null);
    }
  };

  const ManageView: React.FC = () => {
    const [bulkText, setBulkText] = useState<string>(allFacilities.join("\n"));
    useEffect(() => setBulkText(allFacilities.join("\n")), [allFacilities]);
    const applyBulk = () => {
      const list = uniqueTrimmed(bulkText.split("\n"));
      if (list.length === 0) {
        setMessage("エラー：少なくとも1件の施設名が必要です。");
        return;
      }
      setAllFacilities(list);
      setMessage("全施設リストを更新しました。");
    };
    return (
      <div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="w-full h-64 border"
        />
        <button onClick={applyBulk}>更新</button>
      </div>
    );
  };

  const PlayView: React.FC = () => {
    const toggleManual = (name: Facility) => {
      setManualSelection((prev) => {
        if (prev.includes(name)) {
          return prev.filter((n) => n !== name);
        } else if (prev.length < selectedCount) {
          return [...prev, name];
        } else {
          return prev;
        }
      });
    };

    const resetToInitial = () => {
      setInitialized(false);
      setMarket([]);
      setPool([]);
      setExhausted([]);
      setManualSelection([]);
      setLastAdded(null);
      historyRef.current = [];
    };

    return (
      <div className="space-y-4">
        {!initialized && (
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <label>選択施設数</label>
              <select
                value={selectedCount}
                onChange={(e) => setSelectedCount(Number(e.target.value))}
                className="border rounded p-1"
              >
                {[...Array(11)].map((_, i) => {
                  const v = 5 + i;
                  return (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label>モード</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "random" | "manual")}
                className="border rounded p-1"
              >
                <option value="random">ランダム</option>
                <option value="manual">手動選択</option>
              </select>
            </div>
            <button
              onClick={() => initMarket(selectedCount)}
              className="px-3 py-2 rounded bg-slate-200"
            >
              Start
            </button>
          </div>
        )}

        {initialized && (
          <div className="flex gap-2 items-end flex-wrap">
            <button
              onClick={resetToInitial}
              className="px-3 py-2 rounded bg-slate-200"
            >
              Reset
            </button>
            <button
              onClick={restorePrevious}
              className="px-3 py-2 rounded bg-slate-200"
            >
              戻す
            </button>
          </div>
        )}

        {message && <div className="text-red-500">{message}</div>}

        {!initialized && mode === "manual" && (
          <div>
            <h3>
              手動選択パネル ({manualSelection.length}/{selectedCount})
            </h3>
            <div className="flex flex-wrap gap-1">
              {allFacilities.map((f) => (
                <button
                  key={f}
                  onClick={() => toggleManual(f)}
                  className={`px-2 py-1 border rounded text-xs ${
                    manualSelection.includes(f) ? "bg-blue-200" : ""
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {initialized && (
          <>
            <div>
              <h3>選択中の施設</h3>
              <p className="text-xs text-slate-500 mb-2">
                ※
                カード名をクリックすると補充します（消えた施設は再利用しません）。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {market.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => replaceOne(idx)}
                    className={`p-3 border rounded text-sm text-left ${
                      name === lastAdded ? "bg-amber-100 border-amber-300" : ""
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3>残りの施設</h3>
              <div className="flex flex-wrap gap-1">
                {pool.map((p) => (
                  <span key={p} className="px-2 py-1 border rounded text-xs">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <header className="flex justify-between mb-4">
        <h1>街コロ｜サプライ施設選択アプリ</h1>
        <nav className="flex gap-2">
          <a href="#/" className={route === "/" ? "font-bold" : ""}>
            メイン
          </a>
          <a href="#/manage" className={route === "/manage" ? "font-bold" : ""}>
            施設登録
          </a>
        </nav>
      </header>
      {route === "/" ? <PlayView /> : <ManageView />}
    </div>
  );
}
