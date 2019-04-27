/**
 * Copyright 2019 Alan Orozco <alan@orozco.xyz>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const clamp = num => Math.round(Math.max(0, Math.min(255, num)));

// https://stackoverflow.com/a/29521147
export function hueRotate(color, turns) {
  const [r, g, b] = color;

  const angle = (((turns * 360) % 360) + 360) % 360;

  // prettier-ignore
  const matrix = [
    1, 0, 0, // Reds
    0, 1, 0, // Greens
    0, 0, 1, // Blues
  ];

  // Luminance coefficients.
  const lumR = 0.2126;
  const lumG = 0.7152;
  const lumB = 0.0722;

  // Hue rotate coefficients.
  const hueRotateR = 0.143;
  const hueRotateG = 0.14;
  const hueRotateB = 0.283;

  const cos = Math.cos((angle * Math.PI) / 180);
  const sin = Math.sin((angle * Math.PI) / 180);

  matrix[0] = lumR + (1 - lumR) * cos - lumR * sin;
  matrix[1] = lumG - lumG * cos - lumG * sin;
  matrix[2] = lumB - lumB * cos + (1 - lumB) * sin;

  matrix[3] = lumR - lumR * cos + hueRotateR * sin;
  matrix[4] = lumG + (1 - lumG) * cos + hueRotateG * sin;
  matrix[5] = lumB - lumB * cos - hueRotateB * sin;

  matrix[6] = lumR - lumR * cos - (1 - lumR) * sin;
  matrix[7] = lumG - lumG * cos + lumG * sin;
  matrix[8] = lumB + (1 - lumB) * cos + lumB * sin;

  const R = clamp(matrix[0] * r + matrix[1] * g + matrix[2] * b);
  const G = clamp(matrix[3] * r + matrix[4] * g + matrix[5] * b);
  const B = clamp(matrix[6] * r + matrix[7] * g + matrix[8] * b);

  return [R, G, B];
}
