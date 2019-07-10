
extern crate wasm_bindgen;
extern crate console_error_panic_hook;

//extern crate wee_alloc;
// Use `wee_alloc` as the global allocator.
//#[global_allocator]
//static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

//use std::sync::Arc;
use rustfft::FFTplanner;
use rustfft::num_complex::Complex;
//use rustfft::num_traits::Zero;
//use std::mem;
use std::slice;



use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[allow(unused_macros)]
macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[inline]
pub fn fft_(input_: &mut [f32], output_: &mut [f32], n: usize, inverse: bool) {
    // Complex<f32> is compatible to [f32; 2], so cast forcely
    let input:  &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(input_  as *mut [f32] as *mut Complex<f32>, n )};
    let output: &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(output_ as *mut [f32] as *mut Complex<f32>, n )};
    let mut planner = FFTplanner::new(inverse);
    let fft = planner.plan_fft(n);
    fft.process(input, output)
}


#[wasm_bindgen]
pub fn fft(input_: &mut [f32], output_: &mut [f32], n: usize) {
    fft_(input_, output_, n, false);
}

#[wasm_bindgen]
pub fn ifft(input_: &mut [f32], output_: &mut [f32], n: usize) {
    fft_(input_, output_, n, true);
    let output: &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(output_ as *mut [f32] as *mut Complex<f32>, n )};
    for i in output.iter_mut() {
        *i /= n as f32;
    }
}

#[wasm_bindgen]
pub struct FFT {
    n: usize,
    fft: std::sync::Arc<dyn rustfft::FFT<f32>>,
    ifft: std::sync::Arc<dyn rustfft::FFT<f32>>,
}


#[wasm_bindgen]
impl FFT {
    #[allow(clippy::new_without_default)]
    #[wasm_bindgen(constructor)]
    pub fn new(n: usize) -> Self {
        let fft = FFTplanner::new(false).plan_fft(n);
        let ifft = FFTplanner::new(true).plan_fft(n);
        FFT {
            n,
            fft,
            ifft,
        }
    }

    pub fn fft(&self, input_: &mut [f32], output_: &mut [f32]) {
        let input:  &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(input_  as *mut [f32] as *mut Complex<f32>, self.n )};
        let output: &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(output_ as *mut [f32] as *mut Complex<f32>, self.n )};
        // console_log!("input: {}", input.len());
        self.fft.process(input, output);
    }

    pub fn ifft(&self, input_: &mut [f32], output_: &mut [f32]) {
        let input:  &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(input_  as *mut [f32] as *mut Complex<f32>, self.n )};
        let output: &mut [Complex<f32>] = unsafe { slice::from_raw_parts_mut(output_ as *mut [f32] as *mut Complex<f32>, self.n )};
        self.ifft.process(input, output);
        let n = self.n as f32;
        for i in output.iter_mut() {
            *i /= n;
        }
    }
}
