import styled from 'styled-components';

export const Code = styled.code`
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid #eaeaea;
  font-size: 12px;
  padding: 2px 4px;
  margin: 0 1px;
  border-radius: 4px;
  overflow-wrap: break-word;

  @media (prefers-color-scheme: dark) {
    background-color: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;
