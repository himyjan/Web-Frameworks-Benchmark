import { useEffect, useState, lazy, Suspense } from "react";
import chroma from "chroma-js";
import { Benchmark, getBenchmarkData, Hardware } from "./api";
import {
  QueryParamProvider,
} from "use-query-params";
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./views/Home";
import AppHeader from "./components/AppHeader";

const BenchmarkResult = lazy(() => import("./views/BenchmarkResult"));
const CompareFrameworks = lazy(() => import("./views/CompareFramework"));

export type BenchmarkDataSet = Benchmark & {
  color: string;
  label: string;
  backgroundColor: string;
};

function App() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkDataSet[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [hardware, setHardware] = useState<Hardware | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBenchmarkData = async (sha = "master", updateDate = false) => {
    setIsLoading(true);
    const {
      data: benchmarks,
      updatedAt,
      hardware,
    } = await getBenchmarkData(sha);

    // Map data, add additional property for chart datasets
    const data: BenchmarkDataSet[] = benchmarks.map((b, i) => {
      const color = chroma.random();
      return {
        ...b,
        color: color.darken(1).hex(),
        label: `${b.framework.label} (${b.framework.version})`,
        backgroundColor: color.brighten(0.5).hex(),
      };
    });

    setBenchmarks(data);
    if (updateDate) setUpdatedAt(updatedAt.split(" ")[0]);
    setHardware(hardware);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBenchmarkData(
      new URLSearchParams(window.location.search).get("sha") ?? "master",
      true
    );
    window.addEventListener('locationchange', function () {
      window.scrollTo(0, 0);
    });
    return () => {
      window.removeEventListener('locationchange', function () {
        window.scrollTo(0, 0);
      })
    };
  }, []);

  return (
    <BrowserRouter>
      <QueryParamProvider
        adapter={ReactRouter6Adapter}
      >
        <div>
          <AppHeader onHistoryChange={fetchBenchmarkData} />
          {isLoading && <div className="loader">Loading...</div>}
          <div className={`container ${isLoading ? "hidden" : ""}`}>
            <Suspense fallback={<div className="loader">Loading...</div>}>
              <Routes>
                <Route path="/"
                  element={<Home updateDate={updatedAt} hardware={hardware} />}
                />
                <Route path="/result"
                  element={<BenchmarkResult benchmarks={benchmarks} />}
                />
                <Route path="/compare"
                  element={<CompareFrameworks benchmarks={benchmarks} />}
                />
              </Routes>
            </Suspense>
          </div>
          {/* Bottom Space */}
          <div style={{ height: "25vh" }}></div>{" "}
        </div>
      </QueryParamProvider>
    </BrowserRouter>
  );
}

export default App;
