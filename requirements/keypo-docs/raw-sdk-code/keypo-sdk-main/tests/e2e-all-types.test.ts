import { preProcess } from '../src/preProcess';
import { postProcess } from '../src/postProcess';

async function runE2EAllTypesTest() {
  try {
    // 1. String
    const str = 'Hello, E2E!';
    const { dataOut: strData, metadataOut: strMeta } = await preProcess(str, 'string-test', true);
    const strResult = postProcess<string>(strData, strMeta, true);
    console.log('String round-trip:', strResult === str ? '✅' : '❌');

    // 2. Number
    const num = 12345;
    const { dataOut: numData, metadataOut: numMeta } = await preProcess(num, 'number-test', true);
    const numResult = postProcess<number>(numData, numMeta, true);
    console.log('Number round-trip:', numResult === num ? '✅' : '❌');

    // 3. BigInt
    const big = BigInt('9007199254740991');
    const { dataOut: bigData, metadataOut: bigMeta } = await preProcess(big, 'bigint-test', true);
    const bigResult = postProcess<bigint>(bigData, bigMeta, true);
    console.log('BigInt round-trip:', bigResult === big ? '✅' : '❌');

    // 4. Boolean
    const bool = true;
    const { dataOut: boolData, metadataOut: boolMeta } = await preProcess(bool, 'boolean-test', true);
    const boolResult = postProcess<boolean>(boolData, boolMeta, true);
    console.log('Boolean round-trip:', boolResult === bool ? '✅' : '❌');

    // 5. Object
    const obj = { foo: 'bar', nested: { n: 42 } };
    const { dataOut: objData, metadataOut: objMeta } = await preProcess(obj, 'object-test', true);
    const objResult = postProcess<typeof obj>(objData, objMeta, true);
    console.log('Object round-trip:', JSON.stringify(objResult) === JSON.stringify(obj) ? '✅' : '❌');

    // 6. Map
    const mapEntries: [string, any][] = [['a', 1], ['b', { c: 2 }]];
    const map: Map<string, any> = new Map(mapEntries);
    const { dataOut: mapData, metadataOut: mapMeta } = await preProcess(map, 'map-test', true);
    const mapResult = postProcess<Map<string, any>>(mapData, mapMeta, true);
    const mapMatch = JSON.stringify(Array.from(mapResult.entries())) === JSON.stringify(Array.from(map.entries()));
    console.log('Map round-trip:', mapMatch ? '✅' : '❌');

    // 7. Set
    const set = new Set([1, 2, 3, 4]);
    const { dataOut: setData, metadataOut: setMeta } = await preProcess(set, 'set-test', true);
    const setResult = postProcess<Set<number>>(setData, setMeta, true);
    const setMatch = JSON.stringify(Array.from(setResult)) === JSON.stringify(Array.from(set));
    console.log('Set round-trip:', setMatch ? '✅' : '❌');

    // 8. Buffer
    const buf = Buffer.from('Buffer test!');
    const { dataOut: bufData, metadataOut: bufMeta } = await preProcess(buf, 'buffer-test', true);
    const bufResult = postProcess<Buffer>(bufData, bufMeta, true);
    const bufMatch = bufResult.equals(buf);
    console.log('Buffer round-trip:', bufMatch ? '✅' : '❌');

    // 9. ArrayBuffer
    const ab = new ArrayBuffer(8);
    new Uint8Array(ab).set([1,2,3,4,5,6,7,8]);
    const { dataOut: abData, metadataOut: abMeta } = await preProcess(ab, 'arraybuffer-test', true);
    const abResult = postProcess<ArrayBuffer>(abData, abMeta, true);
    const abMatch = Buffer.from(abResult).equals(Buffer.from(ab));
    console.log('ArrayBuffer round-trip:', abMatch ? '✅' : '❌');

    // 10. TypedArray
    const ta = new Uint8Array([9,8,7,6,5]);
    const { dataOut: taData, metadataOut: taMeta } = await preProcess(ta, 'typedarray-test', true);
    const taResult = postProcess<Uint8Array>(taData, taMeta, true);
    const taMatch = JSON.stringify(Array.from(taResult)) === JSON.stringify(Array.from(ta));
    console.log('TypedArray round-trip:', taMatch ? '✅' : '❌');

    // 11. Null
    const { dataOut: nullData, metadataOut: nullMeta } = await preProcess(null, 'null-test', true);
    const nullResult = postProcess<null>(nullData, nullMeta, true);
    console.log('Null round-trip:', nullResult === null ? '✅' : '❌');

    // 12. Undefined
    const { dataOut: undefData, metadataOut: undefMeta } = await preProcess(undefined, 'undefined-test', true);
    const undefResult = postProcess<undefined>(undefData, undefMeta, true);
    console.log('Undefined round-trip:', undefResult === null ? '✅' : '❌'); // postProcess returns null for undefined

    console.log('\nAll E2E type tests completed!');
  } catch (err) {
    console.error('E2E all-types test error:', err);
    process.exit(1);
  }
}

runE2EAllTypesTest(); 