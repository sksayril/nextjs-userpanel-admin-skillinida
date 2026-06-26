export const registrationIdCardPrintStyles = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    body.print-registration-id-card {
      width: 100% !important;
      height: auto !important;
      background: white !important;
      color: black !important;
    }

    body.print-registration-id-card * {
      visibility: hidden !important;
    }

    body.print-registration-id-card #registration-id-card-print-area,
    body.print-registration-id-card #registration-id-card-print-area * {
      visibility: visible !important;
    }

    body.print-registration-id-card #registration-id-card-print-area {
      position: absolute !important;
      left: 50% !important;
      top: 12mm !important;
      transform: translateX(-50%) !important;
      width: calc(100% - 24mm) !important;
      max-width: 180mm !important;
      margin: 0 !important;
      padding: 10mm !important;
      box-shadow: none !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 12px !important;
      background: white !important;
      page-break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;
