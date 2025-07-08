<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('address');
            $table->decimal('latitude', 11, 8);
            $table->decimal('longitude', 11, 8);
            $table->date('date');
            $table->time('time');
            $table->decimal('duration', 3, 1);
            $table->text('description');
            $table->int('maxVolunteers');
            $table->enum('status', ['active', 'closed'])->default('recruiting');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
