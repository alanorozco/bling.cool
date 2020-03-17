export const Toggle = ({ children, name }) => (
  <label class="label-toggle" for={name}>
    <input id={name} type="checkbox" />
    <span>{children}</span>
  </label>
);
