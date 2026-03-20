/**
 * ARK: Survival Evolved binary save file parser.
 * Ported from autodonov1/ark_parser.py — focused on extracting wild dino data.
 */

class ArkBinaryReader {
  private buf: Buffer;
  private pos: number;
  private size: number;

  constructor(data: Buffer) {
    this.buf = data;
    this.pos = 0;
    this.size = data.length;
  }

  tell(): number { return this.pos; }
  seek(offset: number) { this.pos = offset; }
  remaining(): number { return this.size - this.pos; }

  readBytes(count: number): Buffer {
    const result = this.buf.subarray(this.pos, this.pos + count);
    this.pos += count;
    return result;
  }

  readInt8(): number {
    const v = this.buf.readInt8(this.pos);
    this.pos += 1;
    return v;
  }

  readUInt8(): number {
    const v = this.buf.readUInt8(this.pos);
    this.pos += 1;
    return v;
  }

  readInt16(): number {
    const v = this.buf.readInt16LE(this.pos);
    this.pos += 2;
    return v;
  }

  readUInt16(): number {
    const v = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return v;
  }

  readInt32(): number {
    const v = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  readUInt32(): number {
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  readInt64(): bigint {
    const v = this.buf.readBigInt64LE(this.pos);
    this.pos += 8;
    return v;
  }

  readUInt64(): bigint {
    const v = this.buf.readBigUInt64LE(this.pos);
    this.pos += 8;
    return v;
  }

  readFloat(): number {
    const v = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return v;
  }

  readDouble(): number {
    const v = this.buf.readDoubleLE(this.pos);
    this.pos += 8;
    return v;
  }

  readString(): string {
    const length = this.readInt32();
    if (length === 0) return '';
    if (length === 1) { this.pos += 1; return ''; }
    if (length === -1) { this.pos += 2; return ''; }
    if (length < 0) {
      const byteCount = Math.abs(length) * 2;
      const data = this.buf.subarray(this.pos, this.pos + byteCount);
      this.pos += byteCount;
      return data.subarray(0, data.length - 2).toString('utf16le');
    }
    const data = this.buf.subarray(this.pos, this.pos + length);
    this.pos += length;
    return data.subarray(0, data.length - 1).toString('ascii');
  }

  readUUID(): Buffer {
    return this.readBytes(16);
  }

  readFName(nameTable: string[]): string {
    const rawId = this.readInt32();
    const instance = this.readInt32();
    if (rawId === 0) return 'None';
    const idx = rawId - 1;
    if (idx >= 0 && idx < nameTable.length) {
      let name = nameTable[idx];
      if (instance > 0) name = `${name}_${instance - 1}`;
      return name;
    }
    return `<invalid_name_${rawId}>`;
  }
}

export interface WildDino {
  className: string;
  level: number;
  wildStats: number[];  // 12-element array: [HP, Stam, Torpidity, Oxy, Food, Water, Temp, Weight, Melee, Speed, Fortitude, Crafting]
  currentStats: number[];  // 12-element array of actual stat values (floats from CurrentStatusValues)
  x: number;
  y: number;
  z: number;
  isFemale: boolean;
}

export function parseArkSave(data: Buffer): WildDino[] {
  const reader = new ArkBinaryReader(data);

  // Read header
  const version = reader.readInt16();

  const storedData: [bigint, bigint][] = [];
  if (version > 10) {
    for (let i = 0; i < 4; i++) {
      storedData.push([reader.readInt64(), reader.readInt64()]);
    }
  }

  let hibernationOffset = 0;
  if (version > 6) {
    hibernationOffset = reader.readInt32();
    reader.readInt32(); // hibernation unknown
  }

  let nameTableOffset = 0;
  let propertiesBlockOffset = 0;
  if (version > 5) {
    nameTableOffset = reader.readInt32();
    propertiesBlockOffset = reader.readInt32();
  }

  reader.readFloat(); // game_time
  if (version > 8) reader.readInt32(); // save_count

  // Read name table
  const nameTable: string[] = [];
  if (version > 5 && nameTableOffset > 0) {
    const savedPos = reader.tell();
    reader.seek(nameTableOffset);
    const ntCount = reader.readInt32();
    if (ntCount > 0 && ntCount < 5000000) {
      for (let i = 0; i < ntCount; i++) {
        nameTable.push(reader.readString());
      }
    }
    reader.seek(savedPos);
  }

  // Read data files
  const dfCount = reader.readInt32();
  if (dfCount > 0 && dfCount < 100000) {
    for (let i = 0; i < dfCount; i++) reader.readString();
  }

  // Read embedded data
  const edCount = reader.readInt32();
  if (edCount > 0 && edCount < 100000) {
    for (let i = 0; i < edCount; i++) {
      reader.readString(); // path
      const partCount = reader.readInt32();
      for (let p = 0; p < partCount; p++) {
        const blobCount = reader.readInt32();
        for (let b = 0; b < blobCount; b++) {
          const wordCount = reader.readInt32();
          reader.readBytes(wordCount * 4);
        }
      }
    }
  }

  // Read object map
  const omCount = reader.readInt32();
  if (omCount > 0 && omCount < 100000) {
    for (let i = 0; i < omCount; i++) {
      const levelCount = reader.readInt32();
      for (let l = 0; l < levelCount; l++) {
        reader.readInt32();
        reader.readInt32();
      }
    }
  }

  // Read objects
  interface RawObject {
    index: number;
    className: string;
    hasLocation: boolean;
    x: number;
    y: number;
    z: number;
    propertiesOffset: number;
    propsSize: number;
    isDino: boolean;
    isComponent: boolean;
  }

  const objCount = reader.readInt32();
  if (objCount < 0 || objCount > 10000000) return [];

  const objects: RawObject[] = [];
  const hasNT = nameTable.length > 0;

  for (let i = 0; i < objCount; i++) {
    reader.readBytes(16); // UUID

    let className: string;
    if (hasNT) {
      className = reader.readFName(nameTable);
    } else {
      className = reader.readString();
    }

    reader.readInt32(); // is_item

    const namesCount = reader.readInt32();
    for (let n = 0; n < namesCount; n++) {
      if (hasNT) {
        reader.readInt32(); reader.readInt32(); // fname
      } else {
        reader.readString();
      }
    }

    reader.readInt32(); // from_data_file
    reader.readInt32(); // data_file_index

    const hasLocation = reader.readInt32() !== 0;
    let x = 0, y = 0, z = 0;
    if (hasLocation) {
      x = reader.readFloat();
      y = reader.readFloat();
      z = reader.readFloat();
      reader.readFloat(); // pitch
      reader.readFloat(); // yaw
      reader.readFloat(); // roll
    }

    const propertiesOffset = reader.readInt32();
    const propsSize = reader.readInt32();

    const cnLower = className.toLowerCase();
    const isDino = cnLower.includes('character_bp') && !cnLower.includes('player');
    const isComponent = cnLower.includes('statuscomponent') || cnLower.includes('characterstatus');

    if (isDino || isComponent) {
      objects.push({
        index: i,
        className,
        hasLocation,
        x, y, z,
        propertiesOffset,
        propsSize,
        isDino,
        isComponent,
      });
    }
  }

  // Sort objects by properties offset for sequential reading
  const sorted = [...objects].sort((a, b) => a.propertiesOffset - b.propertiesOffset);

  // Find properties block end
  let propsBlockEnd = data.length;
  for (const [off] of storedData) {
    const offNum = Number(off);
    if (offNum > 0 && offNum < propsBlockEnd) {
      propsBlockEnd = offNum;
    }
  }

  // Read properties for dinos and their status components
  // We need: TamingTeamID (to check if wild), NumberOfLevelUpPointsApplied (wild stats), bIsFemale
  const dinoProps = new Map<number, Record<string, any>>();

  for (let idx = 0; idx < sorted.length; idx++) {
    const obj = sorted[idx];
    const absOffset = propertiesBlockOffset + obj.propertiesOffset;
    if (absOffset <= 0 || absOffset >= data.length) continue;

    const nextAbs = idx + 1 < sorted.length
      ? propertiesBlockOffset + sorted[idx + 1].propertiesOffset
      : propsBlockEnd;

    reader.seek(absOffset);

    try {
      const props = readProperties(reader, nameTable, hasNT, nextAbs);
      dinoProps.set(obj.index, { ...props, _obj: obj });
    } catch {
      // Skip objects we can't parse
    }
  }

  // Build a map of object index -> properties for status components
  const componentMap = new Map<number, Record<string, any>>();
  let dinoCount = 0;
  let compCount = 0;
  for (const [, props] of dinoProps) {
    const obj = props._obj as RawObject;
    if (obj.isComponent) {
      componentMap.set(obj.index, props);
      compCount++;
    }
    if (obj.isDino) dinoCount++;
  }

  console.log(`[ArkParser] Parsed ${dinoCount} dinos, ${compCount} status components`);

  // Now match dinos to their status components and extract wild stats
  const wildDinos: WildDino[] = [];
  let matchedComponents = 0;

  for (const [, props] of dinoProps) {
    const obj = props._obj as RawObject;
    if (!obj.isDino) continue;

    // Check if wild: no TamingTeamID or TamingTeamID === 0
    const tamingTeamId = props['TamingTeamID'];
    if (tamingTeamId !== undefined && tamingTeamId !== 0) continue;
    if (props['TamerString'] !== undefined) continue;

    // Find the status component for this dino.
    // In ARK saves, components are serialized right after their owning actor,
    // so the status component is typically at index+1, +2, or +3.
    let statusProps: Record<string, any> | undefined;
    for (const offset of [1, 2, 3, 4, 5]) {
      const comp = componentMap.get(obj.index + offset);
      if (comp) {
        statusProps = comp;
        break;
      }
    }

    // Extract NumberOfLevelUpPointsApplied from the status component
    let wildStats: number[] = new Array(12).fill(0);
    const source = statusProps || props; // prefer component, fall back to dino

    if (statusProps) matchedComponents++;

    // Try as array first
    const statPoints = source['NumberOfLevelUpPointsApplied'];
    if (Array.isArray(statPoints)) {
      wildStats = statPoints.map((v: any) => typeof v === 'number' ? v : 0);
    } else {
      // Try indexed properties: NumberOfLevelUpPointsApplied[0] through [11]
      for (let i = 0; i < 12; i++) {
        const key = i === 0 ? 'NumberOfLevelUpPointsApplied' : `NumberOfLevelUpPointsApplied[${i}]`;
        const val = source[key];
        if (typeof val === 'number') wildStats[i] = val;
      }
    }

    // Also check dino object directly if component had nothing
    if (statusProps && wildStats.every(v => v === 0)) {
      const fallbackPoints = props['NumberOfLevelUpPointsApplied'];
      if (Array.isArray(fallbackPoints)) {
        wildStats = fallbackPoints.map((v: any) => typeof v === 'number' ? v : 0);
      } else {
        for (let i = 0; i < 12; i++) {
          const key = i === 0 ? 'NumberOfLevelUpPointsApplied' : `NumberOfLevelUpPointsApplied[${i}]`;
          const val = props[key];
          if (typeof val === 'number') wildStats[i] = val;
        }
      }
    }

    // Extract CurrentStatusValues (actual HP, Melee, etc.) from the status component
    let currentStats: number[] = new Array(12).fill(0);
    const csvSource = statusProps || props;
    const csvArray = csvSource['CurrentStatusValues'];
    if (Array.isArray(csvArray)) {
      currentStats = csvArray.map((v: any) => typeof v === 'number' ? v : 0);
    } else {
      for (let i = 0; i < 12; i++) {
        const key = i === 0 ? 'CurrentStatusValues' : `CurrentStatusValues[${i}]`;
        const val = csvSource[key];
        if (typeof val === 'number') currentStats[i] = val;
      }
    }
    // Fallback to dino props if component had nothing
    if (statusProps && currentStats.every(v => v === 0)) {
      const csvFallback = props['CurrentStatusValues'];
      if (Array.isArray(csvFallback)) {
        currentStats = csvFallback.map((v: any) => typeof v === 'number' ? v : 0);
      } else {
        for (let i = 0; i < 12; i++) {
          const key = i === 0 ? 'CurrentStatusValues' : `CurrentStatusValues[${i}]`;
          const val = props[key];
          if (typeof val === 'number') currentStats[i] = val;
        }
      }
    }
    while (currentStats.length < 12) currentStats.push(0);

    // Pad to 12
    while (wildStats.length < 12) wildStats.push(0);

    const level = 1 + wildStats.reduce((a, b) => a + b, 0);
    const isFemale = props['bIsFemale'] === true;

    wildDinos.push({
      className: obj.className,
      level,
      wildStats,
      currentStats,
      x: obj.x,
      y: obj.y,
      z: obj.z,
      isFemale,
    });
  }

  console.log(`[ArkParser] ${wildDinos.length} wild dinos found, ${matchedComponents} matched to status components`);
  return wildDinos;
}

function readProperties(
  reader: ArkBinaryReader,
  nameTable: string[],
  hasNT: boolean,
  limit: number
): Record<string, any> {
  const props: Record<string, any> = {};

  for (let i = 0; i < 10000; i++) {
    if (reader.tell() > limit - 8) break;

    const name = hasNT ? reader.readFName(nameTable) : reader.readString();
    if (!name || name === 'None') break;

    const typeName = hasNT ? reader.readFName(nameTable) : reader.readString();
    if (!typeName) break;

    const dataSize = reader.readInt32();
    const arrayIndex = reader.readInt32();

    const key = arrayIndex === 0 ? name : `${name}[${arrayIndex}]`;

    try {
      const val = readPropertyValue(reader, typeName, dataSize, limit, nameTable, hasNT);
      props[key] = val;
    } catch {
      break;
    }
  }

  return props;
}

function readPropertyValue(
  reader: ArkBinaryReader,
  typeName: string,
  dataSize: number,
  limit: number,
  nameTable: string[],
  hasNT: boolean,
): any {
  switch (typeName) {
    case 'BoolProperty':
      return reader.readUInt8() !== 0;

    case 'IntProperty':
    case 'Int32Property':
      return reader.readInt32();

    case 'UInt32Property':
      return reader.readUInt32();

    case 'Int16Property':
      return reader.readInt16();

    case 'UInt16Property':
      return reader.readUInt16();

    case 'Int8Property':
      return reader.readInt8();

    case 'UInt8Property':
      return reader.readUInt8();

    case 'Int64Property':
      return Number(reader.readInt64());

    case 'UInt64Property':
      return Number(reader.readUInt64());

    case 'FloatProperty':
      return reader.readFloat();

    case 'DoubleProperty':
      return reader.readDouble();

    case 'StrProperty':
      return reader.readString();

    case 'NameProperty':
      return hasNT ? reader.readFName(nameTable) : reader.readString();

    case 'ObjectProperty':
      if (dataSize === 12) {
        return [reader.readInt32(), reader.readInt32(), reader.readInt32()];
      }
      if (dataSize >= 8) {
        return [reader.readInt32(), reader.readInt32()];
      }
      return reader.readInt32();

    case 'ByteProperty': {
      const enumName = hasNT ? reader.readFName(nameTable) : reader.readString();
      if (dataSize === 1) return reader.readUInt8();
      if (enumName && enumName !== 'None') {
        return hasNT ? reader.readFName(nameTable) : reader.readString();
      }
      return reader.readUInt8();
    }

    case 'StructProperty': {
      const structType = hasNT ? reader.readFName(nameTable) : reader.readString();
      const end = reader.tell() + dataSize;
      const val = readStruct(reader, structType, dataSize, end, nameTable, hasNT);
      return val;
    }

    case 'ArrayProperty': {
      const innerType = hasNT ? reader.readFName(nameTable) : reader.readString();
      const end = reader.tell() + dataSize;
      const val = readArray(reader, innerType, dataSize, end, nameTable, hasNT);
      return val;
    }

    default:
      // Skip unknown property types
      reader.readBytes(dataSize);
      return undefined;
  }
}

function readStruct(
  reader: ArkBinaryReader,
  structType: string,
  dataSize: number,
  endOffset: number,
  nameTable: string[],
  hasNT: boolean,
): any {
  switch (structType) {
    case 'Vector':
    case 'Rotator':
      return { x: reader.readFloat(), y: reader.readFloat(), z: reader.readFloat() };
    case 'Vector2D':
      return { x: reader.readFloat(), y: reader.readFloat() };
    case 'Quat':
      return { x: reader.readFloat(), y: reader.readFloat(), z: reader.readFloat(), w: reader.readFloat() };
    case 'Color':
      return { b: reader.readUInt8(), g: reader.readUInt8(), r: reader.readUInt8(), a: reader.readUInt8() };
    case 'LinearColor':
      return { r: reader.readFloat(), g: reader.readFloat(), b: reader.readFloat(), a: reader.readFloat() };
    case 'UniqueNetIdRepl': {
      const size = reader.readInt32();
      return size > 0 ? reader.readString() : '';
    }
    case 'Guid':
      return { a: reader.readUInt32(), b: reader.readUInt32(), c: reader.readUInt32(), d: reader.readUInt32() };
    case 'IntPoint':
      return { x: reader.readInt32(), y: reader.readInt32() };
    default:
      return readProperties(reader, nameTable, hasNT, endOffset);
  }
}

function readArray(
  reader: ArkBinaryReader,
  innerType: string,
  dataSize: number,
  endOffset: number,
  nameTable: string[],
  hasNT: boolean,
): any[] {
  const count = reader.readInt32();
  if (count < 0 || count > 1000000) return [];

  switch (innerType) {
    case 'IntProperty':
    case 'Int32Property':
      return Array.from({ length: count }, () => reader.readInt32());
    case 'UInt32Property':
      return Array.from({ length: count }, () => reader.readUInt32());
    case 'Int16Property':
      return Array.from({ length: count }, () => reader.readInt16());
    case 'UInt16Property':
      return Array.from({ length: count }, () => reader.readUInt16());
    case 'FloatProperty':
      return Array.from({ length: count }, () => reader.readFloat());
    case 'DoubleProperty':
      return Array.from({ length: count }, () => reader.readDouble());
    case 'BoolProperty':
      return Array.from({ length: count }, () => reader.readUInt8() !== 0);
    case 'StrProperty':
      return Array.from({ length: count }, () => reader.readString());
    case 'NameProperty':
      return Array.from({ length: count }, () =>
        hasNT ? reader.readFName(nameTable) : reader.readString()
      );
    case 'ObjectProperty':
      if (count > 0 && (dataSize - 4) / count >= 8) {
        return Array.from({ length: count }, () => [reader.readInt32(), reader.readInt32()]);
      }
      return Array.from({ length: count }, () => reader.readInt32());
    case 'ByteProperty':
      return Array.from(reader.readBytes(count));

    case 'StructProperty': {
      // Read struct array header
      const headerStart = reader.tell();
      let structName = '';
      if (count > 0 && (endOffset - headerStart) > 8) {
        const peekName = hasNT ? reader.readFName(nameTable) : reader.readString();
        const peekType = hasNT ? reader.readFName(nameTable) : reader.readString();
        if (peekType === 'StructProperty') {
          reader.readInt32(); // element data size
          reader.readInt32(); // array index
          structName = hasNT ? reader.readFName(nameTable) : reader.readString();
          reader.readBytes(16); // GUID
        } else {
          reader.seek(headerStart);
        }
      }
      const results: any[] = [];
      for (let i = 0; i < count; i++) {
        if (reader.tell() >= endOffset) break;
        results.push(readProperties(reader, nameTable, hasNT, endOffset));
      }
      return results;
    }

    default: {
      const remaining = endOffset - reader.tell();
      if (remaining > 0) reader.readBytes(remaining);
      return [];
    }
  }
}

/**
 * Extract all unique class names from a save file (lightweight — no property parsing).
 */
export function listAllClassNames(data: Buffer): string[] {
  const reader = new ArkBinaryReader(data);

  const version = reader.readInt16();
  const storedData: [bigint, bigint][] = [];
  if (version > 10) {
    for (let i = 0; i < 4; i++) storedData.push([reader.readInt64(), reader.readInt64()]);
  }
  if (version > 6) { reader.readInt32(); reader.readInt32(); }

  let nameTableOffset = 0;
  if (version > 5) { nameTableOffset = reader.readInt32(); reader.readInt32(); }

  reader.readFloat();
  if (version > 8) reader.readInt32();

  const nameTable: string[] = [];
  if (version > 5 && nameTableOffset > 0) {
    const savedPos = reader.tell();
    reader.seek(nameTableOffset);
    const ntCount = reader.readInt32();
    if (ntCount > 0 && ntCount < 5000000) {
      for (let i = 0; i < ntCount; i++) nameTable.push(reader.readString());
    }
    reader.seek(savedPos);
  }

  const dfCount = reader.readInt32();
  if (dfCount > 0 && dfCount < 100000) {
    for (let i = 0; i < dfCount; i++) reader.readString();
  }

  const edCount = reader.readInt32();
  if (edCount > 0 && edCount < 100000) {
    for (let i = 0; i < edCount; i++) {
      reader.readString();
      const partCount = reader.readInt32();
      for (let p = 0; p < partCount; p++) {
        const blobCount = reader.readInt32();
        for (let b = 0; b < blobCount; b++) {
          const wordCount = reader.readInt32();
          reader.readBytes(wordCount * 4);
        }
      }
    }
  }

  const omCount = reader.readInt32();
  if (omCount > 0 && omCount < 100000) {
    for (let i = 0; i < omCount; i++) {
      const levelCount = reader.readInt32();
      for (let l = 0; l < levelCount; l++) { reader.readInt32(); reader.readInt32(); }
    }
  }

  const objCount = reader.readInt32();
  if (objCount < 0 || objCount > 10000000) return [];

  const hasNT = nameTable.length > 0;
  const classNames = new Set<string>();

  for (let i = 0; i < objCount; i++) {
    reader.readBytes(16); // UUID
    let className: string;
    if (hasNT) { className = reader.readFName(nameTable); }
    else { className = reader.readString(); }

    reader.readInt32(); // is_item
    const namesCount = reader.readInt32();
    for (let n = 0; n < namesCount; n++) {
      if (hasNT) { reader.readInt32(); reader.readInt32(); }
      else { reader.readString(); }
    }
    reader.readInt32(); reader.readInt32(); // from_data_file, data_file_index

    const hasLocation = reader.readInt32() !== 0;
    if (hasLocation) { reader.readBytes(24); } // x,y,z,pitch,yaw,roll

    reader.readInt32(); reader.readInt32(); // propertiesOffset, propsSize

    classNames.add(className);
  }

  return Array.from(classNames).sort();
}

// Per-map coordinate conversion: { latShift, lonShift, latDiv, lonDiv }
// Formula: lat = y / latDiv + latShift, lon = x / lonDiv + lonShift
const MAP_COORDS: Record<string, { latShift: number; lonShift: number; latDiv: number; lonDiv: number }> = {
  'TheIsland':        { latShift: 50,     lonShift: 50,     latDiv: 8000,  lonDiv: 8000 },
  'ScorchedEarth_P':  { latShift: 50,     lonShift: 50,     latDiv: 8000,  lonDiv: 8000 },
  'TheCenter':        { latShift: 30.34,  lonShift: 55.10,  latDiv: 9584,  lonDiv: 9600 },
  'Ragnarok':         { latShift: 50,     lonShift: 50,     latDiv: 13100, lonDiv: 13100 },
  'Aberration_P':     { latShift: 50,     lonShift: 50,     latDiv: 8000,  lonDiv: 8000 },
  'Extinction':       { latShift: 50,     lonShift: 50,     latDiv: 8000,  lonDiv: 8000 },
  'Valguero_P':       { latShift: 50,     lonShift: 50,     latDiv: 8160,  lonDiv: 8160 },
  'Genesis':          { latShift: 50,     lonShift: 50,     latDiv: 10500, lonDiv: 10500 },
  'CrystalIsles':     { latShift: 48.75,  lonShift: 50,     latDiv: 16000, lonDiv: 17000 },
  'Gen2':             { latShift: 49.655, lonShift: 49.655, latDiv: 14500, lonDiv: 14500 },
  'LostIsland':       { latShift: 51.634, lonShift: 49.02,  latDiv: 15300, lonDiv: 15300 },
  'Fjordur':          { latShift: 50,     lonShift: 50,     latDiv: 7141,  lonDiv: 7141 },
};

/**
 * Convert ARK UE4 coordinates to in-game GPS lat/lon.
 */
export function ue4ToLatLon(x: number, y: number, mapName: string): { lat: number; lon: number } {
  // Find matching map config (try exact match, then substring match)
  let coords = MAP_COORDS[mapName];
  if (!coords) {
    const key = Object.keys(MAP_COORDS).find(k => mapName.toLowerCase().includes(k.toLowerCase()));
    coords = key ? MAP_COORDS[key] : { latShift: 50, lonShift: 50, latDiv: 8000, lonDiv: 8000 };
  }

  const lat = y / coords.latDiv + coords.latShift;
  const lon = x / coords.lonDiv + coords.lonShift;
  return {
    lat: Math.round(lat * 10) / 10,
    lon: Math.round(lon * 10) / 10,
  };
}

/**
 * Map ARK class names to species IDs used in the tracker.
 */
export function classNameToSpeciesId(className: string): string {
  // ARK class names look like "Rex_Character_BP_C" or "Gigant_Character_BP_C"
  // Strip the _C suffix and _Character_BP part
  let id = className.replace(/_C$/, '').replace(/_Character_BP$/, '');

  // Handle some known mappings
  const mappings: Record<string, string> = {
    'Rex': 'Rex',
    'Gigant': 'Gigant',
    'Therizino': 'Therizino',
    'Spino': 'Spino',
    'Yutyrannus': 'Yutyrannus',
    'Megatherium': 'Megatherium',
    'Rhino': 'Rhino',
    'Daeodon': 'Daeodon',
    'Turtle': 'Turtle',
    'Paracer': 'Paracer',
    'Stego': 'Stego',
    'GasBags': 'GasBags',
    'Trike': 'Trike',
    'Ptero': 'Ptero',
    'Argent': 'Argent',
    'Quetz': 'Quetz',
    'Tapejara': 'Tapejara',
    'Tropeognathus': 'Tropeognathus',
    'Pela': 'Pela',
    'Owl': 'Owl',
    'IceJumper': 'IceJumper',
    'Spindles': 'Spindles',
    'RockDrake': 'RockDrake',
    'LionfishLion': 'LionfishLion',
    'BogSpider': 'BogSpider',
    'Cherufe': 'Cherufe',
    'MilkGlider': 'MilkGlider',
    'SpaceWhale': 'SpaceWhale',
    'CaveWolf': 'CaveWolf',
    'Basilisk': 'Basilisk',
    'Tusoteuthis': 'Tusoteuthis',
    'Basilosaurus': 'Basilosaurus',
    'Mosa': 'Mosa',
    'Plesiosaur': 'Plesiosaur',
    'Ankylo': 'Ankylo',
    'Doed': 'Doed',
    'Mammoth': 'Mammoth',
    'Mantis': 'Mantis',
    'Baryonyx': 'Baryonyx',
    'Thylacoleo': 'Thylacoleo',
    'Megalosaurus': 'Megalosaurus',
    'Sarco': 'Sarco',
    'Kaprosuchus': 'Kaprosuchus',
    'Direbear': 'Direbear',
    'Megalania': 'Megalania',
    'BionicRex': 'BionicRex',
    'BionicStego': 'BionicStego',
    'BionicTrike': 'BionicTrike',
    'BionicQuetz': 'BionicQuetz',
    'BionicRaptor': 'BionicRaptor',
    'BionicPara': 'BionicPara',
    'Deinonychus': 'Deinonychus',
    'Andrewsarchus': 'Andrewsarchus',
    'Desmodus': 'Desmodus',
    'Sinomacrops': 'Sino',
    'Procoptodon': 'Procoptodon',
    // Wyverns
    'Wyvern_Character_BP_Fire': 'FireWyvern',
    'Wyvern_Character_BP_Lightning': 'LightningWyvern',
    'Wyvern_Character_BP_Poison': 'PoisonWyvern',
    'Ragnarok_Wyvern_Override_Ice': 'IceWyvern',
    'TekWyvern': 'VoidWyvern',
    // Crystal wyverns
    'CrystalWyvern_Character_BP_Blood': 'BloodCrystalWyvern',
    'CrystalWyvern_Character_BP_Ember': 'EmberCrystalWyvern',
    'CrystalWyvern_Character_BP_WS': 'TropicalCrystalWyvern',
    // X-variants (Bog/Volcano/Snow/Ocean prefixed)
    'Bog_Paracer': 'X_Paracer',
    'Bog_Raptor': 'X_Raptor',
    'Bog_Spino': 'X_Spino',
    'Bog_Tapejara': 'X_Tapejara',
    'Volcano_Golem': 'X_Golem',
    'Ocean_Basilosaurus': 'X_Basilosaurus',
    'Ocean_Dunkle': 'X_Dunkleosteus',
    'Ocean_Megalodon': 'X_Megalodon',
    'Ocean_Mosa': 'X_Mosa',
    'Snow_Argent': 'X_Argent',
    'Snow_Rhino': 'X_Rhino',
    'Snow_Yutyrannus': 'X_Yutyrannus',
    'Volcano_Allo': 'X_Allo',
    'Volcano_Ankylo': 'X_Ankylo',
    'Volcano_Rex': 'X_Rex',
    'Volcano_Trike': 'X_Trike',
    // R-variants
    'Allo_Character_BP_Rockwell': 'R_Allo',
    'Carno_Character_BP_Rockwell': 'R_Carno',
    'Daeodon_Character_BP_Eden': 'R_Daeodon',
    'Dilo_Character_BP_Rockwell': 'R_Dilo',
    'Direwolf_Character_BP_Eden': 'R_Direwolf',
    'Equus_Character_BP_Eden': 'R_Equus',
    'GasBags_Character_BP_Eden': 'R_GasBags',
    'Gigant_Character_BP_Rockwell': 'R_Gigant',
    'Megatherium_Character_BP_Eden': 'R_Megatherium',
    'Owl_Character_BP_Eden': 'R_Owl',
    'Para_Character_BP_Eden': 'R_Para',
    'Procoptodon_Character_BP_Eden': 'R_Procoptodon',
    'Quetz_Character_BP_Rockwell': 'R_Quetz',
    'Sauropod_Character_BP_Rockwell': 'R_Sauropod',
    'Spindles_Character_BP_Rockwell': 'R_Velo',
    'Thylacoleo_Character_BP_Eden': 'R_Thylacoleo',
    'Turtle_Character_BP_Rockwell': 'R_Carbo',
  };

  // Try full class name first (for variants)
  const fullName = className.replace(/_C$/, '');
  if (mappings[fullName]) return mappings[fullName];

  // Then try the stripped ID
  if (mappings[id]) return mappings[id];

  return id;
}
