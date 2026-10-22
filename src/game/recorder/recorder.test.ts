import { expect, test } from '../../test/check';
import { HeadlessCoco } from '../coco/headless';
import { CASE, PLACE } from '../computer/layout';
import { pileCassette } from '../computer/pile';
import { CAS, spotPose } from './layout';
import { type CassetteId, Recorder } from './recorder';

/** A recorder with both cassettes, the May one in it, March's issue on the table (`current`) and May's on the pile. */
function withMay(current: () => CassetteId): Recorder {
  const r = new Recorder(new HeadlessCoco().interp, (f) => f === 'issue2-waiting', () => {});
  r.current = current;
  r.piled = (id) => (id === r.current() ? null : pileCassette(0));
  r.put('may');
  return r;
}

/** Steps `r` through `secs`, the poses of cassette `id` on the way. */
function carry(r: Recorder, id: CassetteId, secs: number) {
  const out = [];
  for (let i = 0; i < secs * 60; i++) {
    r.step(1 / 60);
    out.push(r.pose(id)!);
  }
  return out;
}

/** Over the machine (a cassette's width either side of it), every pose is clear of its hump and in front of the set's face. */
function overTheMachine(poses: { x: number; y: number; z: number }[]): boolean {
  const over = poses.filter((p) => Math.abs(p.x) < CASE.hw + CAS.hw);
  return over.length > 0 && over.every((p) => p.y - CAS.hd > CASE.hump && p.z > -PLACE.z);
}

test('a cassette taken out of the recorder for the pile is carried in front of the set and over the machine', () => {
  const r = withMay(() => 'march');
  r.click('march');
  const poses = carry(r, 'may', 6);
  expect(overTheMachine(poses)).toBe(true);
  const end = poses[poses.length - 1];
  expect([end.x, end.z]).toEqual([pileCassette(0).x, pileCassette(0).z]);
});

test('the issues changing places, a cassette lying on the pile is carried over the machine to its spot by the recorder', () => {
  let current: CassetteId = 'march';
  const r = withMay(() => current);
  r.put('march');
  const was = r.lyingNow();
  expect([was.may?.x, was.march]).toEqual([pileCassette(0).x, undefined]);
  current = 'may';
  r.shift(was);
  expect(r.cassettes().find((c) => c.id === 'may')?.out).toBe(false);
  const poses = carry(r, 'may', 2);
  expect(overTheMachine(poses)).toBe(true);
  const end = poses[poses.length - 1];
  expect([end.x, end.z]).toEqual([spotPose(1).x, spotPose(1).z]);
  expect(r.cassettes().find((c) => c.id === 'may')?.out).toBe(true);
});
