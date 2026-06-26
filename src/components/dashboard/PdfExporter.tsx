"use client";

import React, { useState } from "react";
import { UserInputs, CalculationResults } from "@/utils/carbonCalculator";
import { getRuleSuggestions } from "@/utils/ruleSuggestions";
import { FileDown, CheckCircle, AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";

interface PdfExporterProps {
  inputs: UserInputs;
  results: CalculationResults;
}

export default function PdfExporter({ inputs, results }: PdfExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const generatePdf = async () => {
    setExporting(true);
    setStatus("idle");

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Page dimensions: 210 x 297 mm
      // Margin: 15 mm (X)

      // --- PAGE 1: COVER & OVERVIEW ---
      // Primary Accent Header (Emerald Green)
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("PERSONAL CARBON FOOTPRINT REPORT", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on ${today} | Metric System`, 15, 30);

      // Section 1: Executive Summary Card
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(15, 50, 180, 42, "F");

      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("EXECUTIVE CLIMATE SUMMARY", 20, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const comparisonText = results.comparisonPercentage > 0
        ? `emit ${results.comparisonPercentage}% MORE than the global average`
        : `emit ${Math.abs(results.comparisonPercentage)}% LESS than the global average`;

      doc.text(`Your estimated carbon footprint is `, 20, 66);
      doc.setFont("helvetica", "bold");
      doc.text(`${(results.yearly.total / 1000).toFixed(2)} metric tons of CO2e per year`, 81, 66);
      doc.setFont("helvetica", "normal");
      doc.text(`which means you ${comparisonText} (~4.5 tons).`, 20, 72);

      const label = "Your overall environmental sustainability score is rated at:";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(label, 20, 78);
      const scoreX = 20 + doc.getTextWidth(label) + 3;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105); // Green 600
      doc.text(`${results.ecoScore} / 100`, scoreX, 78);

      // Reset text color
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Monthly Footprint Breakdown", 15, 105);

      // Draw table headers
      doc.setFillColor(15, 23, 42);
      doc.rect(15, 110, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Category", 20, 115.5);
      doc.text("Emissions (kg CO2e / Month)", 70, 115.5);
      doc.text("Emissions (kg CO2e / Year)", 130, 115.5);

      // Table rows
      const categoriesData = [
        { label: "Transport", monthly: results.monthly.transport, yearly: results.yearly.transport },
        { label: "Home Energy", monthly: results.monthly.energy, yearly: results.yearly.energy },
        { label: "Diet & Food", monthly: results.monthly.food, yearly: results.yearly.food },
        { label: "Consumption & Shopping", monthly: results.monthly.consumption, yearly: results.yearly.consumption },
        { label: "Waste Management", monthly: results.monthly.waste, yearly: results.yearly.waste },
        { label: "Digital Lifestyle", monthly: results.monthly.lifestyle, yearly: results.yearly.lifestyle },
      ];

      let rowY = 118;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      categoriesData.forEach((cat, index) => {
        rowY += 8;
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252); // Slate 50
          doc.rect(15, rowY - 5, 180, 8, "F");
        }
        doc.text(cat.label, 20, rowY);
        doc.text(`${cat.monthly} kg`, 70, rowY);
        doc.text(`${cat.yearly} kg`, 130, rowY);
      });

      // Total row
      rowY += 8;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, rowY - 5, 180, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL FOOTPRINT", 20, rowY);
      doc.text(`${results.monthly.total} kg`, 70, rowY);
      doc.text(`${results.yearly.total} kg`, 130, rowY);

      // Biggest driver note
      doc.setFillColor(254, 242, 242); // Rose 50
      doc.rect(15, rowY + 10, 180, 12, "F");
      doc.setDrawColor(254, 205, 205); // Rose 200
      doc.rect(15, rowY + 10, 180, 12, "D");
      doc.setTextColor(153, 27, 27); // Rose 800
      doc.setFontSize(8.5);
      doc.text(`Primary Carbon Driver: ${results.biggestContributor.label} accounting for ${results.biggestContributor.percentage}% of total emissions.`, 20, rowY + 17);

      // Footer page 1
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Personal Carbon Footprint Analyzer | No Database • No Data Storage • Privacy First", 15, 285);
      doc.text("Page 1 of 2", 185, 285);

      // --- PAGE 2: INPUTS SUMMARY & SUGGESTIONS ---
      doc.addPage();

      // Top Accent Line
      doc.setFillColor(6, 182, 212); // Cyan 500
      doc.rect(0, 0, 210, 4, "F");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("YOUR LIFESTYLE PROFILE SUMMARY", 15, 20);

      // Double-column inputs checklist
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85); // Slate 700

      const leftColX = 15;
      const rightColX = 110;
      let inputY = 28;

      // Col 1
      doc.setFont("helvetica", "bold"); doc.text("Transport Habits:", leftColX, inputY); doc.setFont("helvetica", "normal");
      doc.text(`- Car distance: ${inputs.carDistance} km/week (${inputs.carType})`, leftColX, inputY + 5);
      doc.text(`- Public Transit: ${inputs.publicTransitDistance} km/week`, leftColX, inputY + 10);
      doc.text(`- Annual Flight time: ${inputs.flightHours} hours`, leftColX, inputY + 15);
      doc.text(`- Ride share: ${inputs.rideShareTrips} trips/week`, leftColX, inputY + 20);

      // Col 2
      doc.setFont("helvetica", "bold"); doc.text("Home Energy:", rightColX, inputY); doc.setFont("helvetica", "normal");
      doc.text(`- Electricity: ${inputs.electricityUsage} kWh/month (${inputs.electricityRegion})`, rightColX, inputY + 5);
      doc.text(`- Cooking Gas: ${inputs.cookingLpg} kg LPG/month`, rightColX, inputY + 10);
      doc.text(`- HVAC AC Runtime: ${inputs.acHeatingHours} hours/day`, rightColX, inputY + 15);

      inputY = 58;
      // Col 1
      doc.setFont("helvetica", "bold"); doc.text("Diet Details:", leftColX, inputY); doc.setFont("helvetica", "normal");
      doc.text(`- Beef: ${inputs.beefMeals} meals/week`, leftColX, inputY + 5);
      doc.text(`- Chicken: ${inputs.chickenMeals} meals/week`, leftColX, inputY + 10);
      doc.text(`- Vegan days: ${inputs.veganDays} days/week`, leftColX, inputY + 15);
      doc.text(`- Food waste: ${inputs.foodWaste} kg/week`, leftColX, inputY + 20);

      // Col 2
      doc.setFont("helvetica", "bold"); doc.text("Consumption & Waste:", rightColX, inputY); doc.setFont("helvetica", "normal");
      doc.text(`- Clothing purchased: ${inputs.clothingItems} items/month`, rightColX, inputY + 5);
      doc.text(`- Electronics gadgets: ${inputs.electronicsItems} devices/year`, rightColX, inputY + 10);
      doc.text(`- General waste: ${inputs.wasteAmount} kg/week`, rightColX, inputY + 15);
      doc.text(`- Recycling rate: ${inputs.recyclePercent}% | Compost: ${inputs.compost ? "Yes" : "No"}`, rightColX, inputY + 20);

      // Actionable Savings List
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.line(15, 88, 195, 88);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("RECOMMENDED SAVINGS PLAN", 15, 98);

      const recommendations = getRuleSuggestions(inputs).slice(0, 5); // top 5 recommendations

      let recY = 108;
      recommendations.forEach((rec, idx) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, recY - 5, 180, 20, "F");
        doc.setDrawColor(241, 245, 249);
        doc.rect(15, recY - 5, 180, 20, "D");

        // Category circle tag
        doc.setFillColor(224, 242, 254); // Blue 100
        doc.rect(20, recY - 2, 4, 4, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${rec.title}`, 28, recY + 1);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        // Multiline description wrap
        const splitText = doc.splitTextToSize(rec.description, 130);
        doc.text(splitText, 28, recY + 6);

        // Savings Badge
        doc.setFillColor(209, 250, 229); // Green 100
        doc.rect(162, recY - 2, 28, 7, "F");
        doc.setTextColor(6, 95, 70); // Green 800
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`-${rec.savings} kg/mo`, 166, recY + 2.5);

        recY += 24;
      });

      // Environmental quote at the end
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "oblique");
      doc.setFontSize(9);
      doc.text('"Every small reduction adds up. Thank you for taking a step towards a cooler planet!"', 105, 255, { align: "center" });

      // Footer page 2
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Personal Carbon Footprint Analyzer | Zero Database - Zero Storage Privacy", 15, 285);
      doc.text("Page 2 of 2", 185, 285);

      // Save PDF file
      doc.save("Personal_Carbon_Footprint_Report.pdf");
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={generatePdf}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-900 font-extrabold py-3 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 text-sm"
      >
        {exporting ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Generating Report PDF...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            Download Monthly Report (PDF)
          </>
        )}
      </button>

      {status === "success" && (
        <div className="flex items-center gap-1.5 justify-center text-[11px] text-emerald-400 font-semibold mt-1">
          <CheckCircle className="h-3 w-3" /> Report downloaded successfully!
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-1.5 justify-center text-[11px] text-rose-400 font-semibold mt-1">
          <AlertCircle className="h-3 w-3" /> Failed to generate PDF.
        </div>
      )}
    </div>
  );
}
