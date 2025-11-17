import { expect } from 'chai';
import { Timestamp } from '../main.js';

describe('Timestamp', function() {
	describe('Constructor', function() {
		it('should create timestamp with no arguments', function() {
			const ts = new Timestamp();
			expect(ts).to.be.instanceOf(Timestamp);
			expect(ts.low).to.equal(0);
			expect(ts.high).to.be.greaterThan(0);
		});

		it('should create timestamp with two arguments', function() {
			const ts = new Timestamp(1, 100);
			expect(ts.low).to.equal(1);
			expect(ts.high).to.equal(100);
		});

		it('should create timestamp with single argument as seconds', function() {
			const ts = new Timestamp(100);
			expect(ts.low).to.equal(0);
			expect(ts.high).to.equal(100);
		});

		it('should create timestamp from object with low/high properties', function() {
			const ts = new Timestamp({ low: 5, high: 200 });
			expect(ts.low).to.equal(5);
			expect(ts.high).to.equal(200);
		});

		it('should handle unsigned 32-bit integers', function() {
			const ts = new Timestamp(0xFFFFFFFF, 0xFFFFFFFF);
			expect(ts.low).to.equal(0xFFFFFFFF);
			expect(ts.high).to.equal(0xFFFFFFFF);
		});
	});

	describe('Methods', function() {
		it('should return correct valueOf', function() {
			const ts = new Timestamp(1, 2);
			const value = ts.valueOf();
			expect(value).to.equal(2 * 0x100000000 + 1);
		});

		it('should return correct string representation', function() {
			const ts = new Timestamp(5, 100);
			expect(ts.toString()).to.equal('Timestamp(100, 5)');
		});

		it('should return correct JSON representation', function() {
			const ts = new Timestamp(5, 100);
			const json = ts.toJSON();
			expect(json).to.deep.equal({
				$timestamp: { t: 100, i: 5 }
			});
		});

		it('should compare timestamps for equality', function() {
			const ts1 = new Timestamp(1, 100);
			const ts2 = new Timestamp(1, 100);
			const ts3 = new Timestamp(2, 100);
			
			expect(ts1.equals(ts2)).to.be.true;
			expect(ts1.equals(ts3)).to.be.false;
		});

		it('should compare with object having low/high properties', function() {
			const ts = new Timestamp(1, 100);
			expect(ts.equals({ low: 1, high: 100 })).to.be.true;
			expect(ts.equals({ low: 2, high: 100 })).to.be.false;
		});

		it('should return high and low bits', function() {
			const ts = new Timestamp(5, 100);
			expect(ts.getHighBits()).to.equal(100);
			expect(ts.getLowBits()).to.equal(5);
		});

		it('should convert to Date', function() {
			const ts = new Timestamp(0, 1000);
			const date = ts.toDate();
			expect(date).to.be.instanceOf(Date);
			expect(date.getTime()).to.equal(1000000);
		});
	});

	describe('Static Methods', function() {
		it('should create timestamp from Date', function() {
			const date = new Date('2020-01-01T00:00:00.000Z');
			const ts = Timestamp.fromDate(date);
			expect(ts).to.be.instanceOf(Timestamp);
			expect(ts.low).to.equal(0);
			expect(ts.high).to.equal(Math.floor(date.getTime() / 1000));
		});

		it('should create timestamp with now()', function() {
			const before = Math.floor(Date.now() / 1000);
			const ts = Timestamp.now();
			const after = Math.floor(Date.now() / 1000);
			
			expect(ts).to.be.instanceOf(Timestamp);
			expect(ts.high).to.be.at.least(before);
			expect(ts.high).to.be.at.most(after);
		});
	});

	describe('Comparison', function() {
		it('should compare timestamps by value', function() {
			const ts1 = new Timestamp(0, 100);
			const ts2 = new Timestamp(0, 200);
			expect(ts1.valueOf()).to.be.lessThan(ts2.valueOf());
		});

		it('should handle low bits in comparison', function() {
			const ts1 = new Timestamp(1, 100);
			const ts2 = new Timestamp(2, 100);
			expect(ts1.valueOf()).to.be.lessThan(ts2.valueOf());
		});
	});
});
