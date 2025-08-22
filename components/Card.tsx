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
  relatedQuestions?: Record<string, string[]>;
}

const Card: React.FC<CardProps> = ({ title, content, onWordClick, relatedQuestions }) => {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <ContentDisplay content={content} onWordClick={onWordClick} relatedQuestions={relatedQuestions} />
    </div>
  );
};

export default Card;
