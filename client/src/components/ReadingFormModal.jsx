import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Activity, Check } from 'lucide-react';
import { createReadingApi, updateReadingApi } from '../api/readings';

const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReadingFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const isEditing = Boolean(initialData && initialData.id);

  const [readingDate, setReadingDate] = useState(getTodayString());
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setReadingDate(initialData.reading_date || getTodayString());
      setTimeSlot(initialData.time_slot || TIME_SLOTS[0]);
      setGlucoseValue(initialData.glucose_value ? String(initialData.glucose_value) : '');
    } else {
      setReadingDate(getTodayString());
      setTimeSlot(TIME_SLOTS[0]);
      setGlucoseValue('');
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const today = getTodayString();

    // 1. Date validation
    if (!readingDate) {
      return 'Date is required.';
    }
    if (readingDate > today) {
      return 'Date cannot be in the future.';
    }

    // 2. Time slot validation
    if (!timeSlot || !TIME_SLOTS.includes(timeSlot)) {
      return 'Please select a valid time slot.';
    }

    // 3. Glucose value validation
    if (
      glucoseValue === undefined ||
      glucoseValue === null ||
      glucoseValue === '' ||
      (typeof glucoseValue === 'string' && glucoseValue.trim() === '')
    ) {
      return 'Please enter a glucose value.';
    }

    const num = Number(glucoseValue);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side instant validation
    const clientError = validateForm();
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reading_date: readingDate,
        time_slot: timeSlot,
        glucose_value: parseInt(glucoseValue, 10)
      };

      if (isEditing) {
        await updateReadingApi(initialData.id, payload);
      } else {
        await createReadingApi(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save reading. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {isEditing ? 'Edit Glucose Reading' : 'Record Glucose Reading'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Log up to 4 readings per day across designated time slots
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-danger" data-testid="error-message">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Date Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="reading_date">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} color="var(--color-primary)" />
                Reading Date
              </span>
            </label>
            <input
              id="reading_date"
              data-testid="reading-date"
              type="date"
              max={getTodayString()}
              className="input-field"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              required
            />
          </div>

          {/* Time Slot Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="time_slot">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} color="var(--color-primary)" />
                Time Slot
              </span>
            </label>
            <select
              id="time_slot"
              data-testid="time-slot"
              className="input-field"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Blood Glucose Value */}
          <div className="form-group">
            <label className="form-label" htmlFor="glucose_value">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Activity size={15} color="var(--color-primary)" />
                Blood Glucose (mg/dl)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="glucose_value"
                data-testid="glucose-value"
                type="number"
                placeholder="e.g. 115"
                min="40"
                max="600"
                step="1"
                className="input-field"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                style={{ paddingRight: '4.5rem' }}
                required
              />
              <span style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.825rem',
                color: '#64748b',
                fontWeight: 600,
                pointerEvents: 'none'
              }}>
                mg/dl
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Valid clinical range: 40 – 600 mg/dl</span>
              <span>Whole number only</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              data-testid="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
