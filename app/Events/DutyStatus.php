<?php

namespace App\Events;

/**
 * Duty status for employee location updates.
 */
enum DutyStatus: string
{
    case ON_DUTY = 'on';
    case OFF_DUTY = 'off';
    case NOT_STARTED = 'not';
}
