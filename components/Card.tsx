/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ContentDisplay from './ContentDisplay';

interface CardProps {
  title: string;
  content: string;
  onWordClick: (word: string) => void;
}

const Card: React.FC<CardProps> = ({ title, content, onWordClick }) => {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <ContentDisplay content={content} onWordClick={onWordClick} />
    </div>
  );
};

export default Card;
