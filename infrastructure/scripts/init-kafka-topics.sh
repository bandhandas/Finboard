#!/bin/bash
set -e

KAFKA_BROKER="kafka:29092"
PARTITIONS=1
REPLICATION=1

wait_for_kafka() {
  echo "Waiting for Kafka to be ready..."
  until kafka-broker-api-versions --bootstrap-server "$KAFKA_BROKER" > /dev/null 2>&1; do
    sleep 2
  done
  echo "Kafka is ready."
}

create_topic() {
  local topic=$1
  echo "Creating topic: $topic"
  kafka-topics --create \
    --if-not-exists \
    --bootstrap-server "$KAFKA_BROKER" \
    --topic "$topic" \
    --partitions "$PARTITIONS" \
    --replication-factor "$REPLICATION"
}

wait_for_kafka

# KYC lifecycle events
create_topic "kyc.submitted"
create_topic "kyc.approved"
create_topic "kyc.rejected"

# Banking events
create_topic "bank.verified"
create_topic "bank.transfer.completed"

# Investment events
create_topic "order.placed"
create_topic "order.approved"
create_topic "order.rejected"
create_topic "sip.created"

echo ""
echo "All Kafka topics created:"
kafka-topics --list --bootstrap-server "$KAFKA_BROKER"
