const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const forkquire = require("./");

chai.use(chaiAsPromised);
chai.should();

const longStringLength = 20000000;

describe("Forkquire", () => {

    describe("when forkquiring a module", () => {

        describe("and the module doesn't export a function", () => {

            it("throws an error", () => {

                const fnWrap = () => forkquire("./stubs/no-function-export");

                fnWrap.should.throw(/must export a function/);
            });
        });
        describe("and the module doesn't exist", () => {

            it("throws an error", () => {

                const fnWrap = () => forkquire("./no-module-here");

                fnWrap.should.throw(/Cannot find module/);
            });
        })
    });

    describe("when calling a forkquired function", () => {

        describe("which returns a promise", () => {

            describe("and one argument is passed in", () => {

                it("resolves the expected value", async () => {
                    
                    const resolveInputFork = forkquire("./stubs/resolve-input");

                    const result = await resolveInputFork("test");

                    result.should.equal("test");
                });
            });

            describe("and multiple arguments are passed in", () => {

                it("resolves the expected value", async () => {

                    const resolveInputsSumFork = forkquire("./stubs/resolve-inputs-sum");

                    const result = await resolveInputsSumFork(1, 2, 3);

                    result.should.equal(6);
                });
            });

            describe("and the promise is rejected with an error object", () => {

                it("is rejected in the caller with the error", async () => {
                    
                    const rejectWithErrFork = forkquire("./stubs/reject-with-err");

                    await rejectWithErrFork().should.be.rejectedWith(Error, /Something broke./);
                });
            });

            describe("and the promise is rejected with a string", () => {

                it("it is rejected in the caller with the string", async () => {
                    
                    const rejectWithStringFork = forkquire("./stubs/reject-with-string");

                    const promise = rejectWithStringFork();
                    
                    await promise.should.be.rejected;

                    try {
                       await promise;
                    } catch (err) {
                        (typeof err).should.equal("string");
                    }
                });
            });

            describe("and a function is passed in as an argument", () => {

                it("throws an error", () => {
    
                    const resolveInputFork = forkquire("./stubs/resolve-input");

                    const someFn = () => "This isn't going to be good";

                    const fnWrap = () => resolveInputFork(someFn);

                    fnWrap.should.throw(/function was passed in/);
                });
            });

            describe("and the promise resolves after 1 second", () => {
                
                it("resolves the expected value", async () => {
                    
                    const resolveAfterSSecondsFork = forkquire("./stubs/resolve-after-s-seconds");

                    const result = await resolveAfterSSecondsFork(1);

                    result.should.equal(1);
                });
            });

            describe("and a large argument is pased in", () => {

                it("resolves the expected value", async () => {

                    const makeLongString = require("./stubs/resolve-string-of-length-l");
                    const resolveInputLengthFork = forkquire("./stubs/resolve-input-length");

                    const longString = await makeLongString(longStringLength);

                    const stringLength = await resolveInputLengthFork(longString);

                    stringLength.should.equal(longStringLength);
                });
            });

            describe("which resolves to a large value", () => {
                
                it("resolves the expected value", async () => {

                    const makeLongStringFork = forkquire("./stubs/resolve-string-of-length-l");

                    const longString = await makeLongStringFork(longStringLength);

                    longString.length.should.equal(longStringLength);
                });

                describe("after a large argument is pased in", () => {

                    it("resolves the expected value", async () => {

                        const makeLongString = require("./stubs/resolve-string-of-length-l");

                        const resolveInputFork = forkquire("./stubs/resolve-input");

                        const longString = await makeLongString(longStringLength);

                        const sameLongString = await resolveInputFork(longString);

                        sameLongString.length.should.equal(longString.length);
                    });
                });
            });
        });

        describe("which returns a value", () => {
            
            describe("and one argument is passed in", () => {

                it("returns a promise that resolves to the expected value", () => {

                    const returnInputFork = forkquire("./stubs/return-input");

                    const promise = returnInputFork("hello");

                    promise.should.have.property("then");

                    promise.should.eventually.equal("hello");
                });
            });

            describe("and multiple arguments are passed in", () => {
                
                it("returns the expected value", () => {

                    const returnInputsSumFork = forkquire("./stubs/return-inputs-sum");

                    const promise = returnInputsSumFork(1, 2, 3);

                    promise.should.have.property("then");

                    promise.should.eventually.equal(6);
                });
            });

            describe("and an error is thrown in the target module", () => {

                it("rejects the promise with the error", async () => {

                    const throwErrFork = forkquire("./stubs/throw-err");

                    await throwErrFork().should.be.rejectedWith(Error, /Something broke./);
                });
            });
        });
    });

    describe("when waiting for multiple calls of a forkquired function", () => {

        describe("and the promises all resolve immediately", () => {
            
            it("resolves the expected values", async () => {

                const inputArray = [1, 2, 3];

                const resolveInputFork = forkquire("./stubs/resolve-input");

                const promises = inputArray.map(x => resolveInputFork(x));

                await Promise.all(promises).should.eventually.deep.equal(inputArray);
            });
        });

        describe("and the promises all resolve after 1 second", () => {

            it("resolves the expected values", async () => {

                const inputArray = [1, 1, 1];

                const resolveAfterSSecondsFork = forkquire("./stubs/resolve-after-s-seconds");

                const promises = inputArray.map(x => resolveAfterSSecondsFork(x));

                await Promise.all(promises).should.eventually.deep.equal(inputArray);
            });
        });
    });
});