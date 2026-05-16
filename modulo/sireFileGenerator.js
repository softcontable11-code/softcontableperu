const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const logger = require('./logger');

/**
 * Generador de archivos para cumplimiento SIRE SUNAT
 */
class SireFileGenerator {
  constructor() {
    this.sireDir = path.join(process.cwd(), 'SIRE SUNAT');
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.sireDir)) {
      fs.mkdirSync(this.sireDir, { recursive: true });
    }
  }

  /**
   * Genera el archivo de reemplazo o ajuste para RCE (Compras)
   * Estructura basada en los requerimientos del SIRE (Anexos Técnicos)
   */
  async generarArchivoRCE(records, ruc, periodo, tipo = 'REEMPLAZO') {
    try {
      logger.info(`Generando archivo SIRE RCE (${tipo})`, { ruc, periodo, count: records.length });

      // Estructura de campos para RCE (Resumen simplificado para implementación)
      const lines = records.map(r => {
        const fields = [
          r.ruc_emisor || ruc, // RUC del declarante
          r.nombre_emisor || '', // Apellidos y nombres o razón social
          r.periodo || periodo, // Período
          r.car || '', // CAR (Código de Anotación de Registro)
          r.fecha_emision || r.fecha || '', // Fecha de emisión
          r.fecha_vencimiento || r.fecVcto || '', // Fecha de Vcto/Pago
          r.tipo_comprobante || r.tipo_doc || '', // Tipo de Comprobante
          r.serie || '', // Serie
          r.numero || '', // Número
          '', // Número Final (Si es rango)
          r.doc_tipo_proveedor || r.doc_tipo || '', // Tipo Documento Proveedor
          r.doc_numero_proveedor || r.doc_num || '', // Número Documento Proveedor
          r.nombre_proveedor || r.nombre || '', // Razón Social Proveedor
          (r.bi || 0).toFixed(2), // Base Imponible Gravada
          (r.igv || 0).toFixed(2), // IGV
          (r.bi2 || 0).toFixed(2), // Base Imponible Gravada y No Gravada
          (r.igv2 || 0).toFixed(2), // IGV
          (r.bi3 || 0).toFixed(2), // Base Imponible Sin Derecho Crédito Fiscal
          (r.igv3 || 0).toFixed(2), // IGV
          (r.no_gravado || r.noGravada || 0).toFixed(2), // Valor No Gravado
          (r.isc || 0).toFixed(2), // ISC
          (r.icbper || 0).toFixed(2), // ICBPER
          (r.otros_tributos || 0).toFixed(2), // Otros Tributos
          (r.total || 0).toFixed(2), // Importe Total
          r.moneda || 'PEN', // Moneda
          (r.tc || 1).toFixed(3), // Tipo de Cambio
          r.ref_fecha || '', // Fecha Ref (NCR/NDB)
          r.ref_tipo || '', // Tipo Ref (NCR/NDB)
          r.ref_serie || '', // Serie Ref (NCR/NDB)
          r.ref_numero || '', // Numero Ref (NCR/NDB)
          r.detraccion_fecha || '', // Fecha Detracción
          r.detraccion_numero || '', // Número Detracción
          '', // Indicador de Retención
          '', // Clasificación de Bienes y Servicios
          '', // ID Proyecto Operadores
          '', // Error Tipo 1
          '', // Error Tipo 2
          '', // Error Tipo 3
          '', // Error Tipo 4
          '1' // Estado del Registro (1=Activo)
        ];
        return fields.join('|');
      });

      const content = lines.join('\r\n') + '\r\n';
      
      // Nomenclatura oficial: LE + RUC + AAAA + MM + 00 + COD_LIBRO + TIPO_PROCESO + 1 + 1 + 1
      // COD_LIBRO RCE = 080400
      const baseFilename = `LE${ruc}${periodo}0008040002111`;
      const txtFilename = `${baseFilename}.txt`;
      const zipFilename = `${baseFilename}.zip`;

      return await this.saveAndZip(ruc, txtFilename, zipFilename, content);
    } catch (error) {
      logger.error('Error generando archivo RCE', { error: error.message });
      throw error;
    }
  }

  /**
   * Genera el archivo de reemplazo o ajuste para RVIE (Ventas)
   */
  async generarArchivoRVIE(records, ruc, periodo, tipo = 'REEMPLAZO') {
    try {
      logger.info(`Generando archivo SIRE RVIE (${tipo})`, { ruc, periodo, count: records.length });

      const lines = records.map(r => {
        const fields = [
          r.ruc_emisor || ruc,
          r.nombre_emisor || '',
          r.periodo || periodo,
          r.car || '',
          r.fecha_emision || r.fecha || '',
          r.fecha_vencimiento || r.fecVcto || '',
          r.tipo_comprobante || r.tipo_doc || '',
          r.serie || '',
          r.numero || '',
          '', // Numero Final
          r.doc_tipo_cliente || r.doc_tipo || '',
          r.doc_numero_cliente || r.doc_num || '',
          r.nombre_cliente || r.nombre || '',
          (r.exportacion || 0).toFixed(2),
          (r.bi || 0).toFixed(2),
          (r.descuento_bi || 0).toFixed(2),
          (r.igv || 0).toFixed(2),
          (r.descuento_igv || 0).toFixed(2),
          (r.exonerado || 0).toFixed(2),
          (r.inafecto || 0).toFixed(2),
          (r.isc || 0).toFixed(2),
          (r.bi_ivap || 0).toFixed(2),
          (r.ivap || 0).toFixed(2),
          (r.icbper || 0).toFixed(2),
          (r.otros_tributos || 0).toFixed(2),
          (r.total || 0).toFixed(2),
          r.moneda || 'PEN',
          (r.tc || 1).toFixed(3),
          r.ref_fecha || '',
          r.ref_tipo || '',
          r.ref_serie || '',
          r.ref_numero || '',
          '', // Contrato Operadores
          '', // Error Tipo 1
          '', // Indicador Comprobante Cancelado
          '1' // Estado
        ];
        return fields.join('|');
      });

      const content = lines.join('\r\n') + '\r\n';
      
      // COD_LIBRO RVIE = 140400
      const baseFilename = `LE${ruc}${periodo}0014040002111`;
      const txtFilename = `${baseFilename}.txt`;
      const zipFilename = `${baseFilename}.zip`;

      return await this.saveAndZip(ruc, txtFilename, zipFilename, content);
    } catch (error) {
      logger.error('Error generando archivo RVIE', { error: error.message });
      throw error;
    }
  }

  async saveAndZip(ruc, txtFilename, zipFilename, content) {
    const targetDir = ruc ? path.join(this.sireDir, ruc.toString()) : this.sireDir;
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const txtPath = path.join(targetDir, txtFilename);
    const zipPath = path.join(targetDir, zipFilename);

    // Guardar TXT con codificación ANSI/UTF-8 según requiera SUNAT (usualmente UTF-8 sin BOM)
    fs.writeFileSync(txtPath, content, 'utf8');

    const zip = new AdmZip();
    zip.addLocalFile(txtPath);
    zip.writeZip(zipPath);

    logger.info('Archivo ZIP SIRE generado con éxito', { zipPath });

    return { 
      success: true, 
      zipPath, 
      txtPath,
      filename: zipFilename 
    };
  }
}

module.exports = SireFileGenerator;
