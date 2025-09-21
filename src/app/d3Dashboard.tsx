// d3Dashboard.tsx
// D3.js dashboard for car movement stats and path
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CarPathPoint {
  x: number;
  z: number;
  t: number;
}

interface D3DashboardProps {
  path: CarPathPoint[];
}

export default function D3Dashboard({ path }: D3DashboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || path.length === 0) return;
    const width = 400, height = 400;
    const margin = 30;
    // Scale to fit path
    const xExtent = d3.extent(path, (d: CarPathPoint) => d.x);
    const zExtent = d3.extent(path, (d: CarPathPoint) => d.z);
    const xScale = d3.scaleLinear()
      .domain(xExtent as [number, number])
      .range([margin, width - margin]);
    const yScale = d3.scaleLinear()
      .domain(zExtent as [number, number])
      .range([height - margin, margin]);
    // Clear svg
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current);
    // Draw path
    const line = d3.line<CarPathPoint>()
      .x((d: CarPathPoint) => xScale(d.x))
      .y((d: CarPathPoint) => yScale(d.z));
    svg.append("path")
      .datum(path)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .attr("d", line);
    // Draw points
    svg.selectAll("circle")
      .data(path)
      .enter()
      .append("circle")
      .attr("cx", (d: CarPathPoint) => xScale(d.x))
      .attr("cy", (d: CarPathPoint) => yScale(d.z))
      .attr("r", 3)
      .attr("fill", "#fbbf24");
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin})`)
      .call(d3.axisBottom(xScale));
    svg.append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(yScale));
  }, [path]);

  return (
    <div>
      <svg ref={svgRef} width={400} height={400} style={{ background: "#18181b", borderRadius: 8 }} />
      {/* Table of positions for line-by-line movement */}
      <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', fontSize: 13, color: '#fff', background: '#222', borderRadius: 6 }}>
          <thead>
            <tr style={{ background: '#333' }}>
              <th style={{ padding: '2px 6px' }}>Step</th>
              <th style={{ padding: '2px 6px' }}>X</th>
              <th style={{ padding: '2px 6px' }}>Z</th>
              <th style={{ padding: '2px 6px' }}>Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {path.map((pt, i) => (
              <tr key={i} style={{ background: i % 2 ? '#23232a' : '#18181b' }}>
                <td style={{ padding: '2px 6px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ padding: '2px 6px', textAlign: 'right' }}>{pt.x.toFixed(2)}</td>
                <td style={{ padding: '2px 6px', textAlign: 'right' }}>{pt.z.toFixed(2)}</td>
                <td style={{ padding: '2px 6px', textAlign: 'right' }}>{pt.t.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
