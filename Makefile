OS_TOKEN?=gAAAAABoKQVIBhQwH3I9JgK8_u7w3_iExKdimz7cMm0kuVKOlEYxZk1L8zdDzmK0vLYHlcCu3wPZDUqRDjJxkUF41YQG2b4V2xBamsNEuicf8KRXHDtAi2jKRe5IuKwqSZhfVaq1B_Z58nPieBR5AU4WWwpnnVzRhv9BBlwynRf75Jc7evhwWuE
SIGNATURE_KEY=9xN1etAgs6UN-3oltlyOgjCGg_FpuR5uFKiFsGijaY5h105Vy_6yPUw_9t_rVHgw

ACCOUNT=AUTH_b6a5ec2dfd9f4de9917ffd00ef27794b
CONTAINER_NAME=donnees-sante-clients

EXPOSE_HEADERS= \
	X-Container-Meta-Access-Control-Allow-Methods \
	X-Container-Meta-Access-Control-Allow-Headers \
	X-Container-Meta-Access-Control-Allow-Origin \
	X-Container-Object-Count \
	Access-Control-Allow-Methods \
	Access-Control-Allow-Headers \
	Access-Control-Allow-Origin \
	X-Object-Meta-InputName \
	Content-Disposition \
	X-Timestamp \
	Content-Length \
	Content-Type
ALLOWED_METHODS= \
	GET \
	PUT \
	POST \
	DELETE \
	HEAD
ALLOWED_ORIGINS= \
	http://localhost:10008 \
	https://natbienetre.fr \
	https://*.natbienetre.fr

noop=
space=$(noop) $(noop)
comma=$(noop),

setup: setup-cors setup-temp-url

help:
	curl -sfL -X GET \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		https://storage.gra.cloud.ovh.net/info \
	| jq .tempurl

	curl -sfL -I \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

# https://docs.openstack.org/swift/latest/cors.html
# https://help.ovhcloud.com/csm/en-public-cloud-storage-pcs-cors?id=kb_article_view&sysparm_article=KB0047100#cors-metadata-definition
setup-cors:
	curl -ifL -X POST \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		-H 'X-Container-Meta-Access-Control-Allow-Origin: $(subst $(space), ,$(strip $(ALLOWED_ORIGINS)))' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

	curl -ifL -X POST \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		-H 'X-Container-Meta-Access-Control-Allow-Methods: $(subst $(space),$(comma) ,$(strip $(ALLOWED_METHODS)))' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

	curl -ifL -X POST \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		-H 'X-Container-Meta-Access-Control-Expose-Headers: $(subst $(space), ,$(strip $(EXPOSE_HEADERS)))' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

setup-temp-url:
	curl -ifL -X POST \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		-H 'X-Container-Meta-Temp-URL-Key: $(SIGNATURE_KEY)' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

stat:
	curl -ifL -X GET \
		-H 'X-Auth-Token: $(OS_TOKEN)' \
		'https://storage.gra.cloud.ovh.net/v1/$(ACCOUNT)/$(CONTAINER_NAME)'

i18n:
	composer run makepot
	composer run updatepo
	composer run makephp
	composer run makemo
	composer run makejson
