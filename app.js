/* SAS IT HUB Money Receipt Generator - vanilla JS */

// --- Number to words ---
const ones = ["", "One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
function below1000(n){
  let s = "";
  if (n >= 100){ s += ones[Math.floor(n/100)] + " Hundred"; n %= 100; if (n) s += " "; }
  if (n >= 20){ s += tens[Math.floor(n/10)]; if (n%10) s += " " + ones[n%10]; }
  else if (n > 0){ s += ones[n]; }
  return s;
}
function numberToWords(num){
  if (!isFinite(num)) return "";
  num = Math.floor(Math.abs(num));
  if (num === 0) return "Zero";
  const units = ["","Thousand","Million","Billion","Trillion"];
  let i = 0, result = "";
  while (num > 0){
    const chunk = num % 1000;
    if (chunk) result = below1000(chunk) + (units[i] ? " " + units[i] : "") + (result ? " " + result : "");
    num = Math.floor(num/1000);
    i++;
  }
  return result.trim();
}

const money = v => Number(v||0).toLocaleString("en-IN");
const formatDateLong = iso => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}); }
  catch { return iso; }
};

// --- State ---
let signatureDataUrl = null;
const $ = id => document.getElementById(id);

// init date
$("invoiceDate").value = new Date().toISOString().slice(0,10);

const fields = ["invoiceNumber","invoiceDate","clientName","clientAddress","clientContact",
  "clientWebsite","projectTitle","totalValue","previousPayments","currentPayment",
  "paymentLabel","notes","receivedByName"];

function readForm(){
  const f = {};
  fields.forEach(k => f[k] = $(k).value);
  return f;
}

function updatePreview(){
  const f = readForm();
  const total = Number(f.totalValue||0);
  const prev = Number(f.previousPayments||0);
  const curr = Number(f.currentPayment||0);
  const remaining = Math.max(total - prev - curr, 0);

  $("p-invoiceNumber").textContent = f.invoiceNumber || "—";
  $("p-invoiceDate").textContent = formatDateLong(f.invoiceDate) || "—";
  $("p-clientName").textContent = f.clientName || "—";

  const setRow = (rowId, spanId, val) => {
    if (val){ $(rowId).classList.remove("hidden"); $(spanId).textContent = val; }
    else $(rowId).classList.add("hidden");
  };
  setRow("p-clientAddressRow","p-clientAddress", f.clientAddress);
  setRow("p-clientContactRow","p-clientContact", f.clientContact);
  setRow("p-clientWebsiteRow","p-clientWebsite", f.clientWebsite);

  $("p-projectTitle").textContent = f.projectTitle || "—";
  $("p-totalValue").textContent = money(f.totalValue);
  if (prev > 0){ $("p-previousRow").classList.remove("hidden"); $("p-previousPayments").textContent = money(f.previousPayments); }
  else $("p-previousRow").classList.add("hidden");
  const label = f.paymentLabel || "Payment";
  $("p-paymentLabel1").textContent = label;
  $("p-paymentLabel2").textContent = label;
  $("p-currentPayment").textContent = money(f.currentPayment);
  $("p-currentPayment2").textContent = money(f.currentPayment);
  $("p-remaining").textContent = money(remaining);
  $("p-words").textContent = numberToWords(curr) || "Zero";

  if (f.notes){ $("p-notes").classList.remove("hidden"); $("p-notes").textContent = f.notes; }
  else $("p-notes").classList.add("hidden");

  $("p-receivedByName").textContent = f.receivedByName || "";

  if (signatureDataUrl){
    $("p-signature").src = signatureDataUrl;
    $("p-signature").classList.remove("hidden");
  } else {
    $("p-signature").classList.add("hidden");
  }
}

fields.forEach(k => $(k).addEventListener("input", updatePreview));

// Signature upload
$("signatureFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return toast("Please upload an image","error");
  if (file.size > 2*1024*1024) return toast("Signature image must be under 2MB","error");
  const r = new FileReader();
  r.onload = () => {
    signatureDataUrl = r.result;
    $("signaturePreview").src = signatureDataUrl;
    $("signaturePreviewWrap").classList.remove("hidden");
    updatePreview();
  };
  r.readAsDataURL(file);
});
$("removeSignature").addEventListener("click", () => {
  signatureDataUrl = null;
  $("signatureFile").value = "";
  $("signaturePreviewWrap").classList.add("hidden");
  updatePreview();
});

// Toast
function toast(msg, kind="success"){
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show " + kind;
  setTimeout(() => t.className = "toast " + kind, 2500);
}

// --- PDF Generation ---
function loadImageAsDataUrl(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("Failed to load image: " + src));
    img.src = src;
  });
}
function fitImage(w,h,mw,mh){
  const r = Math.min(mw/w, mh/h);
  return { width: w*r, height: h*r };
}

async function downloadPdf(){
  const btn = $("downloadBtn");
  btn.disabled = true; btn.textContent = "Generating…";
  try {
    const { jsPDF } = window.jspdf;
    const f = readForm();
    let logoDataUrl = null;
    try { logoDataUrl = await loadImageAsDataUrl("assets/sas-it-hub-logo.png"); }
    catch(e){ console.warn("Logo load failed, continuing without logo:", e); }
    const pdf = new jsPDF({ unit:"pt", format:"a4", orientation:"portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = 42;
    let y = 42;
    const total = Number(f.totalValue||0);
    const prev = Number(f.previousPayments||0);
    const curr = Number(f.currentPayment||0);
    const remaining = Math.max(total-prev-curr,0);

    if (logoDataUrl){
      const logoProps = pdf.getImageProperties(logoDataUrl);
      const ls = fitImage(logoProps.width, logoProps.height, 170, 54);
      pdf.addImage(logoDataUrl,"PNG",marginX,y,ls.width,ls.height);
    }
    y += 72;

    pdf.setFont("helvetica","normal"); pdf.setFontSize(8.8); pdf.setTextColor(71,85,105);
    pdf.text("BSCIC Road, Barishal | Contact: 01558833489 | Email: info@sasithub.com | Website: www.sasithub.com", marginX, y);
    y += 14;
    pdf.setDrawColor(30,64,175); pdf.setLineWidth(1.5);
    pdf.line(marginX,y,pageWidth-marginX,y);
    y += 34;

    pdf.setTextColor(30,58,138); pdf.setFont("helvetica","bold"); pdf.setFontSize(24);
    pdf.text("MONEY RECEIPT", pageWidth/2, y, {align:"center"});
    y += 34;

    pdf.setTextColor(15,23,42); pdf.setFontSize(10.5); pdf.setFont("helvetica","normal");
    pdf.text(`Invoice Number: ${f.invoiceNumber||"—"}`, marginX, y);
    pdf.text(`Invoice Date: ${formatDateLong(f.invoiceDate)||"—"}`, pageWidth-marginX, y, {align:"right"});
    y += 28;

    const sectionTitle = t => {
      pdf.setTextColor(30,58,138); pdf.setFont("helvetica","bold"); pdf.setFontSize(10);
      pdf.text(t.toUpperCase(), marginX, y); y += 7;
      pdf.setDrawColor(203,213,225); pdf.setLineWidth(0.6);
      pdf.line(marginX,y,pageWidth-marginX,y); y += 14;
      pdf.setTextColor(15,23,42);
    };
    const writeLine = (t, bold=false) => {
      pdf.setFont("helvetica", bold?"bold":"normal"); pdf.setFontSize(10.5);
      const lines = pdf.splitTextToSize(t, pageWidth-marginX*2);
      pdf.text(lines, marginX, y);
      y += lines.length * 14;
    };

    sectionTitle("Received From");
    writeLine(f.clientName||"—", true);
    if (f.clientAddress) writeLine(`Address: ${f.clientAddress}`);
    if (f.clientContact) writeLine(`Contact: ${f.clientContact}`);
    if (f.clientWebsite) writeLine(`Website: ${f.clientWebsite}`);
    y += 12;

    sectionTitle("Project Details");
    writeLine(`Project: ${f.projectTitle||"—"}`, true);
    writeLine(`Total Project Value: BDT ${money(f.totalValue)}`);
    if (prev > 0) writeLine(`Previous Payments Received: BDT ${money(f.previousPayments)}`);
    writeLine(`${f.paymentLabel||"Payment"} (this receipt): BDT ${money(f.currentPayment)}`);
    writeLine(`Remaining Balance: BDT ${money(remaining)}`);
    y += 14;

    const tx = marginX, tw = pageWidth-marginX*2;
    pdf.setDrawColor(30,58,138); pdf.setLineWidth(1); pdf.setFillColor(239,246,255);
    pdf.rect(tx,y,tw,34,"FD");
    pdf.setFont("helvetica","bold"); pdf.setFontSize(10.5); pdf.setTextColor(15,23,42);
    pdf.text(`Amount Received (${f.paymentLabel||"Payment"}):`, tx+12, y+21);
    pdf.text(`BDT ${money(f.currentPayment)}/-`, tx+tw-12, y+21, {align:"right"});
    y += 34;
    pdf.rect(tx,y,tw,42);
    pdf.setFont("helvetica","normal");
    pdf.text(`In Words: Taka ${numberToWords(curr)||"Zero"} Only`, tx+12, y+25);
    y += 64;

    if (f.notes){
      pdf.setFont("helvetica","italic"); pdf.setTextColor(51,65,85);
      const nl = pdf.splitTextToSize(f.notes, pageWidth-marginX*2);
      pdf.text(nl, marginX, y);
      y += nl.length*14 + 42;
    } else y += 42;

    const sigY = Math.max(y, 600);
    const sigW = 210;
    const leftX = marginX + 20;
    const rightX = pageWidth - marginX - sigW - 20;
    if (signatureDataUrl){
      const sp = pdf.getImageProperties(signatureDataUrl);
      const ss = fitImage(sp.width, sp.height, 180, 54);
      const type = signatureDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(signatureDataUrl, type, leftX+(sigW-ss.width)/2, sigY, ss.width, ss.height);
    }
    pdf.setDrawColor(15,23,42); pdf.setLineWidth(0.8);
    pdf.line(leftX, sigY+68, leftX+sigW, sigY+68);
    pdf.line(rightX, sigY+68, rightX+sigW, sigY+68);
    pdf.setFont("helvetica","normal"); pdf.setTextColor(15,23,42); pdf.setFontSize(10.5);
    pdf.text("Authorized Signature", leftX+sigW/2, sigY+84, {align:"center"});
    if (f.receivedByName){
      pdf.setFont("helvetica","bold");
      pdf.text(f.receivedByName, rightX+sigW/2, sigY+52, {align:"center"});
    }
    pdf.setFont("helvetica","normal");
    pdf.text("Received By", rightX+sigW/2, sigY+84, {align:"center"});

    pdf.setFont("helvetica","italic"); pdf.setTextColor(100,116,139); pdf.setFontSize(9);
    pdf.text("This is a computer-generated receipt issued by SAS IT HUB.", pageWidth/2, 800, {align:"center"});
    pdf.save(`${f.invoiceNumber||"receipt"}.pdf`);
    toast("Receipt downloaded","success");
  } catch (err){
    console.error(err);
    toast("Failed to generate PDF","error");
  } finally {
    btn.disabled = false; btn.textContent = "Download PDF";
  }
}

$("downloadBtn").addEventListener("click", downloadPdf);
updatePreview();
